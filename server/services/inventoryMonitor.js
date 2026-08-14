const Product = require('../models/Product');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { sendLowStockAlert } = require('./emailService');
const { sendUserStreamEvent } = require('../routes/stream');

/**
 * Checks a specific product for low stock and generates an alert if needed.
 * This is designed to be called synchronously (or fire-and-forget) after a product update.
 */
async function checkProductForLowStock(product, user) {
    try {
        if (!product || !user) return;

        // Ensure stock is less than or equal to threshold and threshold > 0 (to avoid 0-threshold spam)
        const threshold = product.reorderThreshold !== undefined ? product.reorderThreshold : 10;
        
        if (product.stockLevel <= threshold) {
            // Check if an alert was already sent recently (within last 24 hours) to avoid spam
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentAlert = await Alert.findOne({
                productId: product._id,
                type: 'stockout_risk',
                timestamp: { $gte: yesterday }
            });

            if (!recentAlert) {
                const severity = product.stockLevel === 0 ? 'critical' : 'high';
                const title = product.stockLevel === 0 ? `Out of Stock: ${product.name}` : `Low Stock: ${product.name}`;
                const message = `Stock level dropped to ${product.stockLevel}. Reorder threshold is ${threshold}.`;

                // Create in-app alert
                await Alert.create({
                    productId: product._id,
                    userId: user._id,
                    type: 'stockout_risk',
                    severity,
                    title,
                    message,
                    metadata: { stockLevel: product.stockLevel, reorderThreshold: threshold }
                });

                // Dispatch real-time SSE event to this user's active session
                sendUserStreamEvent(user._id, {
                    type: 'alert',
                    severity,
                    title,
                    message,
                    productId: product._id,
                    actionUrl: '/dashboard/alerts'
                });

                // Send email notification
                await sendLowStockAlert(user, product);
                console.log(`[InventoryMonitor] Low stock alert created for Product ${product.sku}`);
            }
        }
    } catch (error) {
        console.error('[InventoryMonitor Error] checkProductForLowStock failed:', error);
    }
}

/**
 * Runs a global check across all products in the database.
 * Ideal for a cron job to catch backend syncs or missed updates.
 */
async function runGlobalInventoryCheck() {
    console.log('[InventoryMonitor] Running global inventory check...');
    try {
        // Find products where stock is below or equal to their threshold (default 10 if not set)
        const products = await Product.find({
            $expr: {
                $lte: ['$stockLevel', { $ifNull: ['$reorderThreshold', 10] }]
            }
        });

        for (const product of products) {
            // Load user to get email
            const user = await User.findById(product.userId);
            if (user) {
                await checkProductForLowStock(product, user);
            }
        }
        console.log(`[InventoryMonitor] Completed global inventory check. Evaluated ${products.length} low-stock products.`);
    } catch (error) {
        console.error('[InventoryMonitor Error] runGlobalInventoryCheck failed:', error);
    }
}

module.exports = {
    checkProductForLowStock,
    runGlobalInventoryCheck
};
