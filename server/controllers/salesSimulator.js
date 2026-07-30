const Order = require('../models/Order');
const DailySalesMetric = require('../models/DailySalesMetric');
const Product = require('../models/Product');
const logger = require('../config/logger');

// Helper to normalize date to start of day UTC
const getStartOfDay = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

exports.triggerSimulation = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find user's products
        const products = await Product.find({ userId });
        
        if (products.length === 0) {
            return res.status(400).json({ success: false, message: 'No products found to simulate sales for.' });
        }

        let generatedOrders = 0;

        for (const product of products) {
            // Generate data for the last 30 days
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                
                // Random number of orders per day per product (e.g., 0 to 15)
                const ordersPerDay = Math.floor(Math.random() * 15);
                
                let dailyUnits = 0;
                let dailyRevenue = 0;

                for (let j = 0; j < ordersPerDay; j++) {
                    const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 items
                    const salePrice = product.currentPrice; // Use current price for simulation
                    const totalAmount = quantity * salePrice;
                    
                    dailyUnits += quantity;
                    dailyRevenue += totalAmount;
                    generatedOrders++;
                    
                    // We can either create raw Order documents or just directly increment DailySalesMetric for speed
                    // Since it's a simulation of thousands of orders, generating raw documents might be slow,
                    // but we will do it to be true to the system.
                    const orderId = `sim_${product._id}_${i}_${j}_${Date.now()}`;
                    await Order.create({
                        userId,
                        productId: product._id,
                        orderId,
                        quantity,
                        salePrice,
                        totalAmount,
                        purchasedAt: date,
                        source: 'simulator'
                    });
                }

                // Update Daily Aggregation
                if (dailyUnits > 0) {
                    const metricDate = getStartOfDay(date);
                    const metric = await DailySalesMetric.findOneAndUpdate(
                        { userId, productId: product._id, date: metricDate },
                        { 
                            $inc: { totalUnitsSold: dailyUnits, totalRevenue: dailyRevenue }
                        },
                        { new: true, upsert: true }
                    );
                    metric.averageSalePrice = metric.totalRevenue / metric.totalUnitsSold;
                    await metric.save();
                }
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Simulation completed. Generated ${generatedOrders} synthetic orders across 30 days for ${products.length} products.`
        });
    } catch (error) {
        logger.error('Error running sales simulator:', error);
        res.status(500).json({ success: false, message: 'Server error during simulation.' });
    }
};
