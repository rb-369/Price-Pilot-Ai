/**
 * Stock Sync Service
 * 
 * Handles the write-back side of multi-channel inventory sync:
 * - pushToAll: Push updated stock to ALL other platforms after an order
 * - reconcileAll: Full stock reconciliation across all platforms (every 30 min)
 * - updateSalesVelocity: Recalculate avg hourly sales rate after each order
 */

const Integration = require('../models/Integration');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SyncLog = require('../models/SyncLog');
const { getAdapter } = require('./adapters/adapterFactory');
const logger = require('../config/logger');

/**
 * Push updated stock level to all connected platforms EXCEPT the source platform.
 * Applies the product's safetyBuffer before pushing.
 * 
 * @param {Object} product - Product document
 * @param {string} excludePlatform - Platform that originated the sale (don't push back to it)
 * @param {string} userId - User's ObjectId
 */
async function pushToAll(product, excludePlatform, userId) {
    const integrations = await Integration.find({
        userId,
        status: 'active',
        platform: { $ne: excludePlatform },
    });

    if (integrations.length === 0) {
        logger.info(`[StockSync] No other active integrations to push stock for ${product.sku}`);
        return;
    }

    const adjustedQuantity = Math.max(0, product.stockLevel - (product.safetyBuffer || 2));

    for (const integration of integrations) {
        try {
            const adapter = getAdapter(integration.platform);
            const success = await adapter.pushStockLevel(integration, product, adjustedQuantity);

            await SyncLog.create({
                userId,
                productId: product._id,
                integrationId: integration._id,
                action: 'stock_pushed',
                platform: integration.platform,
                details: {
                    centralStock: product.stockLevel,
                    safetyBuffer: product.safetyBuffer || 2,
                    pushedQuantity: adjustedQuantity,
                    productName: product.name,
                    sku: product.sku,
                },
                status: success ? 'success' : 'failed',
                errorMessage: success ? undefined : 'Push returned false',
            });

            if (success) {
                logger.info(`[StockSync] Pushed stock ${adjustedQuantity} to ${integration.platform} for ${product.sku}`);
            }
        } catch (err) {
            logger.error(`[StockSync] Failed to push stock to ${integration.platform} for ${product.sku}:`, err.message);

            await SyncLog.create({
                userId,
                productId: product._id,
                integrationId: integration._id,
                action: 'stock_pushed',
                platform: integration.platform,
                details: { centralStock: product.stockLevel, pushedQuantity: adjustedQuantity },
                status: 'failed',
                errorMessage: err.message,
            });
        }
    }

    // Update the product's last synced timestamp
    product.lastSyncedAt = new Date();
    await product.save();
}

/**
 * Full stock reconciliation for all users.
 * Runs on a 30-minute cron schedule.
 * 
 * For each user with active integrations:
 * - Push current central stock (minus safety buffer) to all platforms
 * - Log the reconciliation event
 */
async function reconcileAllUsers() {
    logger.info('[StockSync] Starting full stock reconciliation...');

    // Get distinct user IDs that have active integrations
    const userIds = await Integration.distinct('userId', { status: 'active' });

    for (const userId of userIds) {
        try {
            await reconcileUser(userId);
        } catch (err) {
            logger.error(`[StockSync] Reconciliation failed for user ${userId}:`, err.message);
        }
    }

    logger.info('[StockSync] Stock reconciliation complete.');
}

/**
 * Reconcile stock for a single user across all their integrations.
 */
async function reconcileUser(userId) {
    const products = await Product.find({ userId, syncEnabled: true });
    const integrations = await Integration.find({ userId, status: 'active' });

    if (products.length === 0 || integrations.length === 0) return;

    let pushedCount = 0;

    for (const product of products) {
        const adjustedQuantity = Math.max(0, product.stockLevel - (product.safetyBuffer || 2));

        for (const integration of integrations) {
            try {
                const adapter = getAdapter(integration.platform);
                await adapter.pushStockLevel(integration, product, adjustedQuantity);
                pushedCount++;
            } catch (err) {
                logger.error(`[StockSync] Reconciliation push failed: ${product.sku} → ${integration.platform}:`, err.message);
            }
        }

        product.lastSyncedAt = new Date();
        await product.save();
    }

    await SyncLog.create({
        userId,
        action: 'reconciliation',
        details: {
            productsChecked: products.length,
            integrationsChecked: integrations.length,
            stockPushes: pushedCount,
        },
        status: 'success',
    });

    logger.info(`[StockSync] Reconciled ${products.length} products across ${integrations.length} integrations for user ${userId}`);
}

/**
 * Recalculate sales velocity for a product.
 * Uses the last 24 hours of orders to compute avg hourly sales rate.
 * Called after every order ingestion.
 * 
 * @param {Object} product - Product document
 */
async function updateSalesVelocity(product) {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Aggregate total units sold in the last 24 hours
        const result = await Order.aggregate([
            {
                $match: {
                    productId: product._id,
                    purchasedAt: { $gte: twentyFourHoursAgo },
                },
            },
            {
                $group: {
                    _id: null,
                    totalUnits: { $sum: '$quantity' },
                },
            },
        ]);

        const totalUnits24h = result[0]?.totalUnits || 0;
        const avgHourlyRate = totalUnits24h / 24;

        // Also compute peak hourly rate from hourly buckets
        const hourlyBuckets = await Order.aggregate([
            {
                $match: {
                    productId: product._id,
                    purchasedAt: { $gte: twentyFourHoursAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%dT%H', date: '$purchasedAt' },
                    },
                    hourlyUnits: { $sum: '$quantity' },
                },
            },
            { $sort: { hourlyUnits: -1 } },
            { $limit: 1 },
        ]);

        const peakHourlyRate = hourlyBuckets[0]?.hourlyUnits || 0;

        // Update the product
        product.salesVelocity = {
            avgHourlySalesRate: Math.round(avgHourlyRate * 100) / 100,
            lastCalculatedAt: new Date(),
            peakHourlySalesRate: peakHourlyRate,
        };
        await product.save();

        logger.info(`[StockSync] Sales velocity updated for ${product.sku}: avg=${avgHourlyRate.toFixed(2)}/hr, peak=${peakHourlyRate}/hr`);
    } catch (err) {
        logger.error(`[StockSync] Failed to update sales velocity for ${product.sku}:`, err.message);
    }
}

module.exports = { pushToAll, reconcileAllUsers, reconcileUser, updateSalesVelocity };
