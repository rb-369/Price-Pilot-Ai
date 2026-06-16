const axios = require('axios');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PricingRecommendation = require('../models/PricingRecommendation');
const InventoryForecast = require('../models/InventoryForecast');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.getRecommendations = async (req, res) => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [recommendations, total] = await Promise.all([
            PricingRecommendation.find({})
                .populate('productId', 'name sku currentPrice baseCost stockLevel')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            PricingRecommendation.countDocuments({}),
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
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Gather context data
        const competitorPrices = await CompetitorPrice.find({ productId })
            .sort({ timestamp: -1 }).limit(10);
        const demandSignals = await DemandSignal.find({ productId })
            .sort({ timestamp: -1 }).limit(30);

        const payload = {
            product: {
                name: product.name, sku: product.sku,
                baseCost: product.baseCost, currentPrice: product.currentPrice,
                minMargin: product.minMargin, stockLevel: product.stockLevel,
                reorderThreshold: product.reorderThreshold,
            },
            competitorPrices: competitorPrices.map(cp => ({
                name: cp.competitorName, price: cp.competitorPrice,
                inStock: cp.inStock, timestamp: cp.timestamp,
            })),
            demandSignals: demandSignals.map(ds => ({
                searchTrendScore: ds.searchTrendScore, weatherFactor: ds.weatherFactor,
                eventFactor: ds.eventFactor, socialSentimentScore: ds.socialSentimentScore,
                compositeDemandScore: ds.compositeDemandScore, timestamp: ds.timestamp,
            })),
        };

        // Call Python AI service
        const aiResponse = await axios.post(`${AI_URL}/api/optimize-price`, payload);
        const recommendation = aiResponse.data;

        // Save recommendation to DB
        const saved = await PricingRecommendation.create({
            productId,
            recommendedPrice: recommendation.recommendedPrice,
            currentPrice: product.currentPrice,
            reason: recommendation.reason,
            insight: recommendation.insight,
            elasticityUsed: recommendation.elasticityUsed,
            competitorsUsed: recommendation.competitorsUsed,
            factors: recommendation.factors,
            expectedRevenueImpact: recommendation.revenueImpact,
            confidenceScore: recommendation.confidenceScore,
        });

        res.json(saved);
    } catch (error) {
        console.error('AI recommendation error:', error.message);
        res.status(500).json({ message: 'Failed to generate recommendation', error: error.message });
    }
};

exports.getForecast = async (req, res) => {
    try {
        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [forecasts, total] = await Promise.all([
            InventoryForecast.find({})
                .populate('productId', 'name sku stockLevel reorderThreshold')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            InventoryForecast.countDocuments({}),
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
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const demandSignals = await DemandSignal.find({ productId })
            .sort({ timestamp: 1 }).limit(90);

        const payload = {
            product: {
                name: product.name, stockLevel: product.stockLevel,
                reorderThreshold: product.reorderThreshold,
            },
            demandHistory: demandSignals.map(ds => ({
                score: ds.compositeDemandScore, timestamp: ds.timestamp,
            })),
            forecastDays: req.body.forecastDays || 30,
        };

        const aiResponse = await axios.post(`${AI_URL}/api/forecast`, payload);
        const forecast = aiResponse.data;

        const saved = await InventoryForecast.create({
            productId,
            predictedDemand: forecast.predictedDemand,
            recommendedStockIncrease: forecast.recommendedStockIncrease,
            currentStock: product.stockLevel,
            forecastRange: payload.forecastDays,
            reason: forecast.reason,
            confidenceScore: forecast.confidenceScore,
        });

        res.json(saved);
    } catch (error) {
        console.error('AI forecast error:', error.message);
        res.status(500).json({ message: 'Failed to generate forecast', error: error.message });
    }
};

exports.acceptRecommendation = async (req, res) => {
    try {
        const rec = await PricingRecommendation.findById(req.params.id);
        if (!rec) return res.status(404).json({ message: 'Recommendation not found' });

        // Apply price change
        const product = await Product.findById(rec.productId);
        if (product) {
            rec.revenueBeforeChange = product.currentPrice;
            product.currentPrice = rec.recommendedPrice;
            await product.save();
        }

        rec.status = 'accepted';
        rec.appliedAt = new Date();
        await rec.save();

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

        res.json({ message: 'Recommendation rejected', recommendation: rec });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({
            $expr: { $lte: ['$stockLevel', '$reorderThreshold'] },
        });
        const pendingRecommendations = await PricingRecommendation.countDocuments({ status: 'pending' });

        const products = await Product.find({});

        // Inventory Value (price × stock) — correctly labeled, not "revenue"
        const inventoryValue = products.reduce((sum, p) => sum + p.currentPrice * (p.stockLevel || 0), 0);

        // Estimated Revenue from accepted recommendations (actual price changes applied)
        const acceptedRecs = await PricingRecommendation.find({ status: 'accepted' })
            .sort({ appliedAt: -1 })
            .limit(100);
        const estimatedRevenue = acceptedRecs.reduce((sum, rec) => {
            return sum + (rec.recommendedPrice || 0);
        }, 0);

        const avgMargin = products.length > 0
            ? products.reduce((sum, p) => sum + ((p.currentPrice - p.baseCost) / p.currentPrice) * 100, 0) / products.length
            : 0;

        res.json({
            totalProducts,
            lowStockProducts,
            pendingRecommendations,
            inventoryValue: Math.round(inventoryValue),
            estimatedRevenue: Math.round(estimatedRevenue),
            // Keep totalRevenue for backward compatibility but now equals inventoryValue
            totalRevenue: Math.round(inventoryValue),
            avgMargin: avgMargin.toFixed(1),
            acceptedRecommendations: acceptedRecs.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Chart Data endpoint — aggregates real data for dashboard charts.
 * Returns 30 days of demand scores, competitor price averages, and recommendation activity.
 */
exports.getChartData = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Aggregate demand signals per day
        const demandAgg = await DemandSignal.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
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
            { $match: { timestamp: { $gte: startDate } } },
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
            { $match: { timestamp: { $gte: startDate } } },
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

        res.json(chartData);
    } catch (error) {
        console.error('Chart data error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
