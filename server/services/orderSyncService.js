/**
 * Order Sync Service
 * 
 * The core orchestrator for multi-channel order ingestion.
 * Called by cron every 2 minutes:
 * 
 * 1. Load all active integrations
 * 2. For each integration, call the platform adapter's fetchNewOrders()
 * 3. Deduplicate orders
 * 4. Resolve product via productMatchingService
 * 5. Save Order + update DailySalesMetric (via existing processOrder logic)
 * 6. Deduct central stockLevel
 * 7. Trigger cross-platform stock push
 */

const Integration = require('../models/Integration');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');
const User = require('../models/User');
const { getAdapter } = require('./adapters/adapterFactory');
const { matchProduct } = require('./productMatchingService');
const { pushToAll, updateSalesVelocity } = require('./stockSyncService');
const { checkProductForLowStock } = require('./inventoryMonitor');
const logger = require('../config/logger');

// Reuse the processOrder helper from salesController (extracted here for reuse)
const DailySalesMetric = require('../models/DailySalesMetric');

const getStartOfDay = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Process a single normalized order: save to DB, update daily metrics.
 */
async function saveOrder(userId, orderData) {
    const totalAmount = orderData.quantity * orderData.salePrice;

    const order = new Order({
        userId,
        productId: orderData.productId,
        orderId: orderData.orderId,
        quantity: orderData.quantity,
        salePrice: orderData.salePrice,
        totalAmount,
        purchasedAt: orderData.purchasedAt || new Date(),
        source: orderData.source || 'unknown',
        externalOrderId: orderData.externalOrderId,
        platformData: orderData.platformData,
    });
    await order.save();

    // Update daily metric
    const date = getStartOfDay(orderData.purchasedAt);
    const metric = await DailySalesMetric.findOneAndUpdate(
        { userId, productId: orderData.productId, date },
        { $inc: { totalUnitsSold: orderData.quantity, totalRevenue: totalAmount } },
        { new: true, upsert: true }
    );

    if (metric.totalUnitsSold > 0) {
        metric.averageSalePrice = metric.totalRevenue / metric.totalUnitsSold;
        await metric.save();
    }

    return order;
}

/**
 * Poll all active integrations for new orders.
 * This is the main entry point called by cron.
 */
async function pollAllPlatforms() {
    logger.info('[OrderSync] Starting poll cycle for all platforms...');

    const integrations = await Integration.find({ status: 'active' });
    if (integrations.length === 0) {
        logger.info('[OrderSync] No active integrations found, skipping poll.');
        return;
    }

    let totalNewOrders = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const integration of integrations) {
        try {
            const result = await pollSingleIntegration(integration);
            totalNewOrders += result.newOrders;
            totalSkipped += result.skipped;
        } catch (err) {
            totalErrors++;
            logger.error(`[OrderSync] Failed to poll ${integration.platform} for user ${integration.userId}:`, err.message);

            await SyncLog.create({
                userId: integration.userId,
                integrationId: integration._id,
                action: 'poll_failed',
                platform: integration.platform,
                details: { error: err.message },
                status: 'failed',
                errorMessage: err.message,
            });
        }
    }

    logger.info(`[OrderSync] Poll cycle complete. New: ${totalNewOrders}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);
}

/**
 * Poll a single integration for new orders.
 */
async function pollSingleIntegration(integration) {
    const adapter = getAdapter(integration.platform);
    const sinceDate = integration.lastOrderPollAt || new Date(Date.now() - 10 * 60 * 1000); // Default: 10 min ago

    const normalizedOrders = await adapter.fetchNewOrders(integration, sinceDate);

    let newOrders = 0;
    let skipped = 0;

    for (const orderItem of normalizedOrders) {
        try {
            // Dedup: check if orderId already exists
            const existing = await Order.findOne({ userId: integration.userId, orderId: orderItem.orderId });
            if (existing) {
                skipped++;
                continue;
            }

            // Match product
            const match = await matchProduct(integration.userId, orderItem, integration.platform);

            if (!match.product) {
                logger.warn(`[OrderSync] Unmatched order item: ${orderItem.orderId} (${orderItem.productName})`);
                skipped++;

                await SyncLog.create({
                    userId: integration.userId,
                    integrationId: integration._id,
                    action: 'order_ingested',
                    platform: integration.platform,
                    details: {
                        orderId: orderItem.orderId,
                        productName: orderItem.productName,
                        sku: orderItem.sku,
                        matchType: 'unmatched',
                        reason: 'No matching product found',
                    },
                    status: 'partial',
                });
                continue;
            }

            const product = match.product;

            // Save the order
            await saveOrder(integration.userId, {
                ...orderItem,
                productId: product._id,
            });

            // Deduct stock
            const oldStock = product.stockLevel;
            product.stockLevel = Math.max(0, product.stockLevel - orderItem.quantity);
            await product.save();

            // Update sales velocity
            await updateSalesVelocity(product);

            // Log the sync event
            await SyncLog.create({
                userId: integration.userId,
                integrationId: integration._id,
                productId: product._id,
                action: 'order_ingested',
                platform: integration.platform,
                details: {
                    orderId: orderItem.orderId,
                    externalOrderId: orderItem.externalOrderId,
                    productName: product.name,
                    sku: product.sku,
                    quantity: orderItem.quantity,
                    salePrice: orderItem.salePrice,
                    oldStock,
                    newStock: product.stockLevel,
                    matchType: match.matchType,
                    confidence: match.confidence,
                },
                status: 'success',
            });

            // Push stock to other platforms (async, don't block)
            if (product.syncEnabled) {
                pushToAll(product, integration.platform, integration.userId).catch(err => {
                    logger.error(`[OrderSync] Cross-platform stock push failed for ${product.sku}:`, err.message);
                });
            }

            // Check for low stock alert
            const user = await User.findById(integration.userId);
            if (user) {
                checkProductForLowStock(product, user).catch(() => {});
            }

            newOrders++;
        } catch (err) {
            if (err.code === 11000) {
                // Duplicate order — expected during overlapping poll windows
                skipped++;
            } else {
                logger.error(`[OrderSync] Error processing order ${orderItem.orderId}:`, err.message);
            }
        }
    }

    // Update the poll cursor
    integration.lastOrderPollAt = new Date();
    integration.lastSyncedAt = new Date();
    await integration.save();

    // Log poll completion
    if (newOrders > 0 || skipped > 0) {
        await SyncLog.create({
            userId: integration.userId,
            integrationId: integration._id,
            action: 'poll_completed',
            platform: integration.platform,
            details: { newOrders, skipped, totalPolled: normalizedOrders.length },
            status: 'success',
        });
    }

    return { newOrders, skipped };
}

module.exports = { pollAllPlatforms, pollSingleIntegration };
