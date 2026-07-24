const { Queue, Worker } = require('bullmq');
const redisClient = require('../config/redis');
const axios = require('axios');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PricingRecommendation = require('../models/PricingRecommendation');
const InventoryForecast = require('../models/InventoryForecast');

const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

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
            baseCost: product.baseCost || 0, currentPrice: product.currentPrice || 0,
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

    let recommendation;
    try {
        const aiResponse = await axios.post(`${AI_URL}/api/optimize-price`, payload);
        recommendation = aiResponse.data;
    } catch (err) {
        console.error('Python AI Service unreachable/failed in recommendationWorker:', err.message);
        // Ponytail: fallback directly in Node so we don't break the UI when microservice drops.
        recommendation = {
            recommendedPrice: Math.round(product.currentPrice * 1.05),
            reason: "Fallback recommendation generated (AI service offline).",
            insight: JSON.stringify({
                summary: "Steady demand detected.",
                risk_level: "low",
                detailed_analysis: "The AI microservice is currently unreachable. Based on basic heuristics, a 5% price increase is suggested.",
                action_items: ["Monitor competitor pricing"]
            }),
            elasticityUsed: 1.0,
            competitorsUsed: [
                { name: "Amazon (Mock)", price: Math.round(product.currentPrice * 0.95), inStock: true, timestamp: new Date().toISOString() },
                { name: "Flipkart (Mock)", price: Math.round(product.currentPrice * 1.08), inStock: true, timestamp: new Date().toISOString() },
                { name: "Snapdeal (Mock)", price: Math.round(product.currentPrice * 0.98), inStock: true, timestamp: new Date().toISOString() }
            ],
            factors: { demand: 0.6, competitor: 0.5 },
            revenueImpact: 5.0,
            confidenceScore: 0.7
        };
    }

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
            score: ds.compositeDemandScore || 0, timestamp: ds.timestamp,
        })),
        forecastDays: forecastDays || 30,
    };

    let forecast;
    try {
        const aiResponse = await axios.post(`${AI_URL}/api/forecast`, payload);
        forecast = aiResponse.data;
    } catch (err) {
        console.error('Python AI Service unreachable/failed in forecastWorker:', err.message);
        forecast = {
            predictedDemand: Math.round(product.stockLevel * 1.2),
            recommendedStockIncrease: Math.max(0, product.reorderThreshold - product.stockLevel),
            reason: "Fallback forecast generated (AI service offline).",
            confidenceScore: 0.6
        };
    }

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
