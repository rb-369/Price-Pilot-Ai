const axios = require('axios');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PricingRecommendation = require('../models/PricingRecommendation');
const InventoryForecast = require('../models/InventoryForecast');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

exports.getRecommendations = async (req, res) => {
    try {
        const recommendations = await PricingRecommendation.find({})
            .populate('productId', 'name sku currentPrice baseCost stockLevel')
            .sort({ timestamp: -1 })
            .limit(20);
        res.json(recommendations);
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
        const forecasts = await InventoryForecast.find({})
            .populate('productId', 'name sku stockLevel reorderThreshold')
            .sort({ timestamp: -1 })
            .limit(20);
        res.json(forecasts);
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

exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const lowStockProducts = await Product.countDocuments({
            $expr: { $lte: ['$stockLevel', '$reorderThreshold'] },
        });
        const pendingRecommendations = await PricingRecommendation.countDocuments({ status: 'pending' });

        const products = await Product.find({});
        const totalRevenue = products.reduce((sum, p) => sum + p.currentPrice * (p.stockLevel || 1), 0);
        const avgMargin = products.length > 0
            ? products.reduce((sum, p) => sum + ((p.currentPrice - p.baseCost) / p.currentPrice) * 100, 0) / products.length
            : 0;

        res.json({
            totalProducts,
            lowStockProducts,
            pendingRecommendations,
            totalRevenue: Math.round(totalRevenue),
            avgMargin: avgMargin.toFixed(1),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
