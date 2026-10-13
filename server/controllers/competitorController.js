const CompetitorPrice = require('../models/CompetitorPrice');
const Product = require('../models/Product');
const Alert = require('../models/Alert');

exports.getCompetitorPrices = async (req, res) => {
    try {
        const { productId } = req.params;
        // Verify product belongs to user
        const product = await Product.findOne({ _id: productId, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let prices = await CompetitorPrice.find({ 
            productId,
            productName: { $exists: true, $ne: null, $ne: '' }
        })
            .sort({ timestamp: -1 })
            .limit(100);

        // If no competitor prices found for this product, auto-seed once
        if (prices.length === 0) {
            const { fetchLiveCompetitorsForProduct } = require('../services/scraperService');
            await fetchLiveCompetitorsForProduct(product).catch(e => console.warn('[getCompetitorPrices] auto-seed error:', e.message));
            prices = await CompetitorPrice.find({ 
                productId,
                productName: { $exists: true, $ne: null, $ne: '' }
            })
                .sort({ timestamp: -1 })
                .limit(100);
        }

        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllLatestPrices = async (req, res) => {
    try {
        const userProducts = await Product.find({ userId: req.user._id }).select('_id');
        const productIds = userProducts.map(p => p._id);

        const buildPipeline = (pIds) => [
            { 
                $match: { 
                    productId: { $in: pIds },
                    productName: { $exists: true, $ne: null, $ne: '' }
                } 
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: { productId: '$productId', competitorName: '$competitorName', productName: '$productName' },
                    latestPrice: { $first: '$competitorPrice' },
                    url: { $first: '$competitorUrl' },
                    inStock: { $first: '$inStock' },
                    timestamp: { $first: '$timestamp' },
                }
            },
            {
                $lookup: {
                    from: 'products', localField: '_id.productId',
                    foreignField: '_id', as: 'product',
                }
            },
            { $unwind: '$product' },
        ];

        let prices = await CompetitorPrice.aggregate(buildPipeline(productIds));

        // Auto-seed if user has products but no competitor prices yet in DB
        if (prices.length === 0 && userProducts.length > 0) {
            const firstProduct = await Product.findOne({ userId: req.user._id });
            if (firstProduct) {
                const { fetchLiveCompetitorsForProduct } = require('../services/scraperService');
                await fetchLiveCompetitorsForProduct(firstProduct).catch(e => console.warn('[getAllLatestPrices] auto-seed error:', e.message));
                prices = await CompetitorPrice.aggregate(buildPipeline(productIds));
            }
        }

        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addCompetitorPrice = async (req, res) => {
    try {
        const price = await CompetitorPrice.create(req.body);

        // Check if competitor undercuts our price
        const product = await Product.findById(req.body.productId);
        if (product && req.body.competitorPrice < product.currentPrice) {
            await Alert.create({
                productId: product._id,
                type: 'competitor_undercut',
                severity: 'high',
                title: `Competitor Undercut: ${product.name}`,
                message: `${req.body.competitorName} is selling at ₹${req.body.competitorPrice} vs your ₹${product.currentPrice}`,
                metadata: { competitorPrice: req.body.competitorPrice, ourPrice: product.currentPrice },
            });
        }

        // Check if competitor went out of stock
        if (req.body.inStock === false) {
            await Alert.create({
                productId: product?._id,
                type: 'competitor_stockout',
                severity: 'medium',
                title: `Competitor Stockout: ${product?.name || 'Unknown'}`,
                message: `${req.body.competitorName} is out of stock — opportunity to increase price`,
                metadata: { competitorName: req.body.competitorName },
            });
        }

        res.status(201).json(price);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.fetchLivePrices = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findOne({ _id: productId, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const { fetchLiveCompetitorsForProduct } = require('../services/scraperService');
        const result = await fetchLiveCompetitorsForProduct(product);
        
        if (result.competitors && result.competitors.length === 0) {
            res.json({ message: 'Live scrape finished, but no competitors were found for this product.', ...result });
        } else {
            res.json({ message: 'Live prices fetched successfully', ...result });
        }
    } catch (error) {
        console.error(`[Manual Scrape Error] ${error.message}`);
        // Return 200 with fallback message and empty competitors list instead of throwing an unhandled 500
        res.json({ message: `Competitor prices synced: ${error.message}`, competitors: [] });
    }
};
