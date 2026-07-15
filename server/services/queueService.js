const { Queue, Worker } = require('bullmq');
const redisClient = require('../config/redis');
const axios = require('axios');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PricingRecommendation = require('../models/PricingRecommendation');
const InventoryForecast = require('../models/InventoryForecast');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const recommendationQueue = new Queue('recommendationQueue', { connection: redisClient });
const forecastQueue = new Queue('forecastQueue', { connection: redisClient });

// Prefix constants to avoid job ID collisions between queues
const RECOMMENDATION_JOB_PREFIX = 'rec_';
const FORECAST_JOB_PREFIX = 'fc_';

const recommendationWorker = new Worker('recommendationQueue', async job => {
    const { productId } = job.data;
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    const competitorPrices = await CompetitorPrice.find({ productId }).sort({ timestamp: -1 }).limit(10);
    const demandSignals = await DemandSignal.find({ productId }).sort({ timestamp: -1 }).limit(30);

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

    const aiResponse = await axios.post(`${AI_URL}/api/optimize-price`, payload);
    const recommendation = aiResponse.data;

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

    return saved;
}, { connection: redisClient });

const forecastWorker = new Worker('forecastQueue', async job => {
    const { productId, forecastDays } = job.data;
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    const demandSignals = await DemandSignal.find({ productId }).sort({ timestamp: 1 }).limit(90);

    const payload = {
        product: {
            name: product.name, stockLevel: product.stockLevel,
            reorderThreshold: product.reorderThreshold,
        },
        demandHistory: demandSignals.map(ds => ({
            score: ds.compositeDemandScore, timestamp: ds.timestamp,
        })),
        forecastDays: forecastDays || 30,
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

    return saved;
}, { connection: redisClient });

recommendationWorker.on('failed', (job, err) => {
    console.error(`Recommendation Job ${job.id} failed:`, err.message);
});

forecastWorker.on('failed', (job, err) => {
    console.error(`Forecast Job ${job.id} failed:`, err.message);
});

module.exports = {
    recommendationQueue,
    forecastQueue,
    RECOMMENDATION_JOB_PREFIX,
    FORECAST_JOB_PREFIX
};
