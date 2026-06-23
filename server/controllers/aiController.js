const axios = require('axios');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PricingRecommendation = require('../models/PricingRecommendation');
const InventoryForecast = require('../models/InventoryForecast');
const Alert = require('../models/Alert');
const FeedbackLog = require('../models/FeedbackLog');
const redisClient = require('../config/redis');
const { recommendationQueue, forecastQueue } = require('../services/queueService');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.getRecommendations = async (req, res) => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const userProducts = await Product.find({ userId: req.user._id }).select('_id');
        const productIds = userProducts.map(p => p._id);
        const filter = { productId: { $in: productIds } };

        const [recommendations, total] = await Promise.all([
            PricingRecommendation.find(filter)
                .populate('productId', 'name sku currentPrice baseCost stockLevel')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            PricingRecommendation.countDocuments(filter),
        ]);

        res.json({
            data: recommendations,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateRecommendation = async (req, res) => {
    try {
        const { productId } = req.params;
        const job = await recommendationQueue.add('generateRecommendation', { productId });
        res.json({ jobId: job.id, status: 'queued', message: 'Recommendation generation queued.' });
    } catch (error) {
        console.error('AI recommendation queue error:', error.message);
        res.status(500).json({ message: 'Failed to queue recommendation', error: error.message });
    }
};

exports.getForecast = async (req, res) => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const userProducts = await Product.find({ userId: req.user._id }).select('_id');
        const productIds = userProducts.map(p => p._id);
        const filter = { productId: { $in: productIds } };

        const [forecasts, total] = await Promise.all([
            InventoryForecast.find(filter)
                .populate('productId', 'name sku stockLevel reorderThreshold')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            InventoryForecast.countDocuments(filter),
        ]);

        res.json({
            data: forecasts,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateForecast = async (req, res) => {
    try {
        const { productId } = req.params;
        const forecastDays = req.body.forecastDays || 30;
        const job = await forecastQueue.add('generateForecast', { productId, forecastDays });
        res.json({ jobId: job.id, status: 'queued', message: 'Forecast generation queued.' });
    } catch (error) {
        console.error('AI forecast queue error:', error.message);
        res.status(500).json({ message: 'Failed to queue forecast', error: error.message });
    }
};

exports.checkJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        let job = await recommendationQueue.getJob(jobId);
        if (!job) {
            job = await forecastQueue.getJob(jobId);
        }

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const state = await job.getState();
        
        if (state === 'completed') {
            return res.json({ status: state, result: job.returnvalue });
        } else if (state === 'failed') {
            return res.json({ status: state, error: job.failedReason });
        } else {
            return res.json({ status: state });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.acceptRecommendation = async (req, res) => {
    try {
        const rec = await PricingRecommendation.findById(req.params.id);
        if (!rec) return res.status(404).json({ message: 'Recommendation not found' });

        // Apply price change
        const product = await Product.findById(rec.productId);
        let priceBeforeChange = 0;
        let stockBefore = 0;
        
        if (product) {
            priceBeforeChange = product.currentPrice;
            stockBefore = product.stockLevel;
            rec.revenueBeforeChange = product.currentPrice;
            product.currentPrice = rec.recommendedPrice;
            await product.save();
        }

        rec.status = 'accepted';
        rec.appliedAt = new Date();
        await rec.save();

        // Create Feedback Log for ML retraining
        if (product) {
            const latestSignal = await DemandSignal.findOne({ productId: product._id }).sort({ date: -1 });
            const demandScore = latestSignal ? latestSignal.compositeDemandScore : 0.5;
            const searchTrend = latestSignal ? (latestSignal.searchTrendScore / 100) : 0.5;
            
            await FeedbackLog.create({
                recommendationId: rec._id,
                productId: product._id,
                userId: req.user._id,
                priceBeforeChange: priceBeforeChange,
                priceAfterChange: rec.recommendedPrice,
                action: 'accepted',
                features: {
                    demand_score: demandScore,
                    competitor_spread: 0.1, // Approximated
                    stock_ratio: stockBefore / Math.max(product.reorderThreshold || 1, 1),
                    price_level: priceBeforeChange,
                    margin_pct: (priceBeforeChange - product.baseCost) / Math.max(priceBeforeChange, 1),
                    search_trend_normalized: searchTrend
                },
                stockBefore: stockBefore,
                demandScoreBefore: demandScore
            });
        }

        res.json({ message: 'Price updated', recommendation: rec, product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.rejectRecommendation = async (req, res) => {
    try {
        const rec = await PricingRecommendation.findById(req.params.id);
        if (!rec) return res.status(404).json({ message: 'Recommendation not found' });

        if (rec.status !== 'pending') {
            return res.status(400).json({ message: `Cannot reject: recommendation is already ${rec.status}` });
        }

        rec.status = 'rejected';
        rec.rejectionReason = req.body.reason || '';
        await rec.save();

        // Create Feedback Log for ML retraining
        const product = await Product.findById(rec.productId);
        if (product) {
            const latestSignal = await DemandSignal.findOne({ productId: product._id }).sort({ date: -1 });
            const demandScore = latestSignal ? latestSignal.compositeDemandScore : 0.5;
            const searchTrend = latestSignal ? (latestSignal.searchTrendScore / 100) : 0.5;
            
            await FeedbackLog.create({
                recommendationId: rec._id,
                productId: product._id,
                userId: req.user._id,
                priceBeforeChange: product.currentPrice,
                priceAfterChange: product.currentPrice, // Unchanged because rejected
                action: 'rejected',
                features: {
                    demand_score: demandScore,
                    competitor_spread: 0.1, // Approximated
                    stock_ratio: product.stockLevel / Math.max(product.reorderThreshold || 1, 1),
                    price_level: product.currentPrice,
                    margin_pct: (product.currentPrice - product.baseCost) / Math.max(product.currentPrice, 1),
                    search_trend_normalized: searchTrend
                },
                stockBefore: product.stockLevel,
                demandScoreBefore: demandScore
            });
        }

        res.json({ message: 'Recommendation rejected', recommendation: rec });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const cacheKey = `dashboard_stats_${req.user._id}`;
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const totalProducts = await Product.countDocuments({ userId: req.user._id });
        const lowStockProducts = await Product.countDocuments({
            userId: req.user._id,
            $expr: { $lte: ['$stockLevel', '$reorderThreshold'] },
        });
        
        const products = await Product.find({ userId: req.user._id });
        const productIds = products.map(p => p._id);
        
        const pendingRecommendations = await PricingRecommendation.countDocuments({ 
            productId: { $in: productIds }, 
            status: 'pending' 
        });

        // Inventory Value (price × stock)
        const inventoryValue = products.reduce((sum, p) => sum + p.currentPrice * (p.stockLevel || 0), 0);

        // Estimated Revenue from accepted recommendations
        const acceptedRecs = await PricingRecommendation.find({ 
            productId: { $in: productIds }, 
            status: 'accepted' 
        })
            .sort({ appliedAt: -1 })
            .limit(100);
        const estimatedRevenue = acceptedRecs.reduce((sum, rec) => {
            return sum + (rec.recommendedPrice || 0);
        }, 0);

        const avgMargin = products.length > 0
            ? products.reduce((sum, p) => sum + ((p.currentPrice - p.baseCost) / p.currentPrice) * 100, 0) / products.length
            : 0;

        const responseData = {
            totalProducts,
            lowStockProducts,
            pendingRecommendations,
            inventoryValue: Math.round(inventoryValue),
            estimatedRevenue: Math.round(estimatedRevenue),
            totalRevenue: Math.round(inventoryValue),
            avgMargin: avgMargin.toFixed(1),
            acceptedRecommendations: acceptedRecs.length,
        };

        await redisClient.setex(cacheKey, 300, JSON.stringify(responseData)); // Cache for 5 minutes

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Chatbot endpoint — proxies chat requests to the AI service.
 */
exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;
        
        // Gather context for the chatbot (RAG)
        const products = await Product.find({ userId: req.user._id }).limit(20);
        // Only active/critical alerts
        const alerts = await Alert.find({ userId: req.user._id, status: 'active' }).limit(10);
        
        const payload = {
            messages,
            context: {
                products: products.map(p => ({ name: p.name, currentPrice: p.currentPrice, stockLevel: p.stockLevel })),
                alerts: alerts.map(a => ({ type: a.type, title: a.title, message: a.message }))
            }
        };

        const aiResponse = await axios.post(`${AI_URL}/api/chat`, payload);
        res.json(aiResponse.data);
    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({ message: 'Failed to communicate with AI Chatbot', error: error.message });
    }
};

/**
 * Generate Product Description endpoint — calls AI service.
 */
exports.generateProductDescription = async (req, res) => {
    try {
        const { productName, category } = req.body;
        if (!productName) return res.status(400).json({ message: 'Product name is required' });
        
        const aiResponse = await axios.post(`${AI_URL}/api/generate-description`, { product_name: productName, category: category || "" });
        res.json(aiResponse.data);
    } catch (error) {
        console.error('Generate Description error:', error.message);
        res.status(500).json({ message: 'Failed to generate product description', error: error.message });
    }
};

/**
 * Chart Data endpoint — aggregates real data for dashboard charts.
 * Returns 30 days of demand scores, competitor price averages, and recommendation activity.
 */
exports.getChartData = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
        
        const cacheKey = `chart_data_${req.user._id}_${days}`;
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        
        const userProducts = await Product.find({ userId: req.user._id }).select('_id');
        const productIds = userProducts.map(p => p._id);

        // Aggregate demand signals per day
        const demandAgg = await DemandSignal.aggregate([
            { $match: { productId: { $in: productIds }, timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
                    },
                    avgDemandScore: { $avg: '$compositeDemandScore' },
                    avgSearchTrend: { $avg: '$searchTrendScore' },
                    avgSentiment: { $avg: '$socialSentimentScore' },
                    signalCount: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Aggregate competitor prices per day
        const competitorAgg = await CompetitorPrice.aggregate([
            { $match: { productId: { $in: productIds }, timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
                    },
                    avgCompetitorPrice: { $avg: '$competitorPrice' },
                    priceCount: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Aggregate recommendation activity per day
        const recAgg = await PricingRecommendation.aggregate([
            { $match: { productId: { $in: productIds }, timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
                    },
                    recommendations: { $sum: 1 },
                    accepted: {
                        $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
                    },
                    avgRevenueImpact: { $avg: '$expectedRevenueImpact' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Merge all aggregations by date
        const dateMap = new Map();

        demandAgg.forEach(d => {
            dateMap.set(d._id, {
                date: d._id,
                demandScore: Math.round(d.avgDemandScore * 100) / 100,
                searchTrend: Math.round(d.avgSearchTrend),
                sentiment: Math.round(d.avgSentiment * 100) / 100,
                signals: d.signalCount,
            });
        });

        competitorAgg.forEach(c => {
            const existing = dateMap.get(c._id) || { date: c._id };
            existing.avgCompetitorPrice = Math.round(c.avgCompetitorPrice);
            existing.competitorDataPoints = c.priceCount;
            dateMap.set(c._id, existing);
        });

        recAgg.forEach(r => {
            const existing = dateMap.get(r._id) || { date: r._id };
            existing.recommendations = r.recommendations;
            existing.acceptedRecs = r.accepted;
            existing.avgRevenueImpact = Math.round((r.avgRevenueImpact || 0) * 10) / 10;
            dateMap.set(r._id, existing);
        });

        // Sort by date and fill defaults
        const chartData = Array.from(dateMap.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(entry => ({
                date: entry.date,
                day: new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                demandScore: entry.demandScore || 0,
                searchTrend: entry.searchTrend || 0,
                sentiment: entry.sentiment || 0,
                signals: entry.signals || 0,
                avgCompetitorPrice: entry.avgCompetitorPrice || 0,
                competitorDataPoints: entry.competitorDataPoints || 0,
                recommendations: entry.recommendations || 0,
                acceptedRecs: entry.acceptedRecs || 0,
                avgRevenueImpact: entry.avgRevenueImpact || 0,
            }));

        await redisClient.setex(cacheKey, 300, JSON.stringify(chartData)); // Cache for 5 minutes

        res.json(chartData);
    } catch (error) {
        console.error('Chart data error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
