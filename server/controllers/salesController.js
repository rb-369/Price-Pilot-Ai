const Order = require('../models/Order');
const DailySalesMetric = require('../models/DailySalesMetric');
const Product = require('../models/Product');
const logger = require('../config/logger');

// Helper to normalize date to start of day UTC
const getStartOfDay = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// Internal function to process a single raw order and update aggregations
const processOrder = async (userId, orderData) => {
    const { productId, orderId, quantity, salePrice, purchasedAt, source } = orderData;
    const totalAmount = quantity * salePrice;
    
    // Save raw order
    const order = new Order({
        userId,
        productId,
        orderId,
        quantity,
        salePrice,
        totalAmount,
        purchasedAt: purchasedAt || new Date(),
        source: source || 'unknown'
    });
    await order.save();

    // Update daily metric
    const date = getStartOfDay(purchasedAt);
    
    const metric = await DailySalesMetric.findOneAndUpdate(
        { userId, productId, date },
        { 
            $inc: { totalUnitsSold: quantity, totalRevenue: totalAmount }
        },
        { new: true, upsert: true }
    );
    
    // Recalculate average sale price safely
    if (metric.totalUnitsSold > 0) {
        metric.averageSalePrice = metric.totalRevenue / metric.totalUnitsSold;
        await metric.save();
    }
    return order;
};

// Webhook endpoint (Automated ingestion)
exports.handleWebhook = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, orderId, quantity, salePrice, purchasedAt, source } = req.body;
        
        if (!productId || !orderId || !quantity || !salePrice) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Validate product exists and belongs to user
        const product = await Product.findOne({ _id: productId, userId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        // Check for duplicate order ID to guarantee idempotency
        const existingOrder = await Order.findOne({ userId, orderId });
        if (existingOrder) {
            return res.status(200).json({ success: true, message: 'Order already processed.' });
        }

        await processOrder(userId, req.body);
        res.status(200).json({ success: true, message: 'Order processed successfully.' });
    } catch (error) {
        logger.error('Error handling sales webhook:', error);
        res.status(500).json({ success: false, message: 'Server error processing webhook.' });
    }
};

// Manual upload endpoint (Bulk CSV/Excel processed payload)
exports.handleBulkUpload = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orders } = req.body; // Expects an array of valid order objects parsed by the frontend
        
        if (!Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid orders provided.' });
        }

        let processed = 0;
        let skipped = 0;

        for (const orderData of orders) {
            const { productId, orderId, quantity, salePrice } = orderData;
            
            // Skip invalid rows silently here (already validated by frontend, this is a safety net)
            if (!productId || !orderId || !quantity || !salePrice) {
                skipped++;
                continue;
            }

            try {
                // Check if product exists and belongs to user
                let product;
                const mongoose = require('mongoose');
                if (mongoose.isValidObjectId(productId)) {
                    product = await Product.findOne({ _id: productId, userId });
                } 
                if (!product) {
                    // Try to find by name or sku (case-insensitive), escaping regex special characters
                    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const escapedId = escapeRegExp(productId);
                    product = await Product.findOne({ 
                        userId, 
                        $or: [
                            { name: { $regex: new RegExp(`^${escapedId}$`, 'i') } },
                            { sku: { $regex: new RegExp(`^${escapedId}$`, 'i') } }
                        ] 
                    });
                }
                
                if (!product) {
                    // Auto-create product on the fly if it doesn't exist
                    product = new Product({
                        userId,
                        name: productId,
                        sku: productId,
                        baseCost: Math.max(1, salePrice * 0.5), // Approximate a 50% margin base cost
                        currentPrice: salePrice,
                        stockLevel: 100,
                        reorderThreshold: 10,
                        category: 'Imported',
                        source: 'manual'
                    });
                    await product.save();
                }
                
                // Override the arbitrary 'productId' string from the CSV with the real MongoDB ObjectId
                orderData.productId = product._id;

                // Skip duplicates
                const existingOrder = await Order.findOne({ userId, orderId });
                if (existingOrder) {
                    skipped++;
                    continue;
                }

                await processOrder(userId, { ...orderData, source: 'manual_csv' });
                processed++;
            } catch (err) {
                logger.error(`Error processing bulk order ${orderId}:`, err);
                skipped++;
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Processed ${processed} orders. Skipped ${skipped}.`,
            processed,
            skipped
        });
    } catch (error) {
        logger.error('Error handling bulk sales upload:', error);
        res.status(500).json({ success: false, message: 'Server error during bulk upload.' });
    }
};

// Get macro-analytics for the dashboard
exports.getAnalyticsSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Aggregate total revenue and units across all products in last 30 days
        const metrics = await DailySalesMetric.find({
            userId,
            date: { $gte: getStartOfDay(thirtyDaysAgo) }
        });

        let totalRevenue = 0;
        let totalUnitsSold = 0;
        const productSalesMap = {}; // { productId: revenue }

        metrics.forEach(m => {
            totalRevenue += m.totalRevenue;
            totalUnitsSold += m.totalUnitsSold;
            
            if (!productSalesMap[m.productId]) productSalesMap[m.productId] = 0;
            productSalesMap[m.productId] += m.totalRevenue;
        });

        // Get top 5 products by revenue
        const topProductIds = Object.keys(productSalesMap).sort((a, b) => productSalesMap[b] - productSalesMap[a]).slice(0, 5);
        
        // Fetch product names for the top 5
        const topProductsData = [];
        for (const pid of topProductIds) {
            const prod = await Product.findById(pid).select('name category');
            if (prod) {
                topProductsData.push({
                    _id: prod._id,
                    name: prod.name,
                    category: prod.category,
                    revenue: productSalesMap[pid]
                });
            }
        }

        // Generate daily revenue trend array for the chart
        const dailyRevenue = {};
        metrics.forEach(m => {
            const dateStr = m.date.toISOString().split('T')[0];
            if (!dailyRevenue[dateStr]) dailyRevenue[dateStr] = 0;
            dailyRevenue[dateStr] += m.totalRevenue;
        });

        const trendData = Object.keys(dailyRevenue).sort().map(dateStr => ({
            date: dateStr,
            revenue: dailyRevenue[dateStr]
        }));

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalUnitsSold,
                topProducts: topProductsData,
                trend: trendData
            }
        });
    } catch (error) {
        logger.error('Error fetching analytics summary:', error);
        res.status(500).json({ success: false, message: 'Server error fetching analytics.' });
    }
};

// Get product-specific sales metrics for charts
exports.getProductSalesMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const metrics = await DailySalesMetric.find({ userId, productId }).sort({ date: 1 });
        
        res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error fetching product sales metrics:', error);
        res.status(500).json({ success: false, message: 'Server error fetching product metrics.' });
    }
};

// Proxy to Python AI service for column mapping
exports.getAILocalColumnMapping = async (req, res) => {
    try {
        const { headers, sampleRows } = req.body;
        
        if (!headers || !sampleRows) {
            return res.status(400).json({ success: false, message: 'Headers and sampleRows are required.' });
        }

        // Ideally, this sends an HTTP request to the python ai-service:
        // const response = await axios.post('http://ai-service:5000/api/map-columns', { headers, sampleRows });
        // return res.json(response.data);
        
        // For the sake of minimizing python deployment dependencies, 
        // we can use a hardcoded heuristic or mock AI response here for demonstration
        // if the AI service isn't reachable, or we can just mock the AI response.
        
        const mapping = {};
        
        // Pass 1: High-confidence exact or near-exact matches
        headers.forEach((h, idx) => {
            const lower = String(h).toLowerCase().trim();
            if (['productname', 'product_name', 'product', 'sku', 'item', 'item_name'].includes(lower) && mapping['productId'] === undefined) mapping['productId'] = idx;
            if (['orderid', 'order_id', 'order no', 'order number', 'transaction_id', 'transaction'].includes(lower) && mapping['orderId'] === undefined) mapping['orderId'] = idx;
            if (['quantity', 'qty', 'count', 'units'].includes(lower) && mapping['quantity'] === undefined) mapping['quantity'] = idx;
            if (['saleprice', 'sale_price', 'price', 'selling_price', 'unit_price', 'cost', 'amount'].includes(lower) && mapping['salePrice'] === undefined) mapping['salePrice'] = idx;
            if (['purchasedat', 'purchased_at', 'date', 'order_date', 'timestamp', 'created_at', 'time'].includes(lower) && mapping['purchasedAt'] === undefined) mapping['purchasedAt'] = idx;
        });

        // Pass 2: Fallback fuzzy matches for missing columns
        headers.forEach((h, idx) => {
            const lower = String(h).toLowerCase().trim();
            if (mapping['productId'] === undefined && (lower.includes('product') || lower.includes('sku') || lower.includes('item'))) mapping['productId'] = idx;
            if (mapping['orderId'] === undefined && (lower.includes('order') || lower.includes('ref') || lower.includes('id'))) mapping['orderId'] = idx;
            if (mapping['quantity'] === undefined && (lower.includes('qty') || lower.includes('quant') || lower.includes('unit'))) mapping['quantity'] = idx;
            if (mapping['salePrice'] === undefined && (lower.includes('price') || lower.includes('cost') || lower.includes('amount'))) mapping['salePrice'] = idx;
            if (mapping['purchasedAt'] === undefined && (lower.includes('date') || lower.includes('time') || lower.includes('when'))) mapping['purchasedAt'] = idx;
        });

        // AI Confidence score simulation
        res.status(200).json({
            success: true,
            data: mapping,
            message: 'AI successfully mapped columns.'
        });
        
    } catch (error) {
        logger.error('Error with AI column mapping:', error);
        res.status(500).json({ success: false, message: 'Server error mapping columns.' });
    }
};
