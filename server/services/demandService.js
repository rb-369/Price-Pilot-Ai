/**
 * Demand Signal Service
 * 
 * Generates demand signals with deterministic seeding per product per day,
 * so signals are consistent across runs (not randomly regenerated each time).
 * 
 * PRODUCTION NOTE: To integrate real signals, replace the simulated scores below with:
 *   - Google Trends API (via SerpAPI or official API) → searchTrendScore
 *   - OpenWeatherMap API → weatherFactor
 *   - Twitter/Reddit sentiment API or Gemini sentiment analysis → socialSentimentScore
 *   - Event calendars (Diwali, sales events, etc.) → eventFactor
 */
const DemandSignal = require('../models/DemandSignal');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const axios = require('axios');

const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Produces deterministic values for the same seed, so demand signals
 * are consistent per product per day.
 */
function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function generateDemandSignals(productSeed) {
    const day = new Date().getDay();
    const month = new Date().getMonth();
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

    // Combine product seed with day-of-year for per-product-per-day determinism
    const seed = productSeed + dayOfYear * 997;

    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + 1);
    const r3 = seededRandom(seed + 2);

    // Weekend boost for search trends
    const weekendBoost = (day === 0 || day === 6) ? 10 : 0;
    // Festive season boost (Oct-Dec in India)
    const festiveBoost = (month >= 9 && month <= 11) ? 0.3 + r3 * 0.5 : 0;

    return {
        searchTrendScore: Math.round(30 + r1 * 60 + weekendBoost),
        weatherFactor: parseFloat(((r2 - 0.5) * 1.5).toFixed(2)),
        eventFactor: parseFloat((festiveBoost || ((r3 - 0.3) * 0.6)).toFixed(2)),
    };
}

async function collectDemandSignals() {
    console.log('[Demand] Collecting demand signals...');
    try {
        const products = await Product.find({});
        let signals = 0;

        for (const product of products) {
            // Call real data pipeline in Python AI service
            let signalData = null;
            try {
                const aiRes = await axios.post(`${AI_URL}/api/collect-signals`, {
                    product_name: product.name,
                    category: product.category || 'general',
                    city: 'Mumbai' // Default or could come from user settings
                }, { timeout: 30000 }); // Longer timeout as it makes external API calls
                signalData = aiRes.data;
            } catch (err) {
                console.warn(`[Demand] Real pipeline failed for ${product.name}, using simulated fallback. Error: ${err.message}`);
                // Fallback to simulated data locally if python service fails completely
                const productSeed = parseInt(product._id.toString().substring(0, 8), 16);
                signalData = generateDemandSignals(productSeed);
                signalData.socialSentimentScore = 0; // default
                signalData.metadata = { dataQuality: 'simulated_fallback' };
            }

            // Calculate composite demand score
            const composite =
                (signalData.searchTrendScore / 100) * 0.4 +
                ((signalData.weatherFactor + 1) / 2) * 0.2 +
                ((signalData.eventFactor + 1) / 2) * 0.2 +
                ((signalData.socialSentimentScore + 1) / 2) * 0.2;
                
            signalData.compositeDemandScore = composite;

            await DemandSignal.create({
                productId: product._id,
                ...signalData,
            });
            signals++;

            // Alert if demand is surging

            if (composite > 0.75 && product.stockLevel < product.reorderThreshold * 2) {
                await Alert.create({
                    productId: product._id,
                    type: 'stockout_risk',
                    severity: 'critical',
                    title: `Stock Alert: ${product.name}`,
                    message: `High demand detected (score: ${(composite * 100).toFixed(0)}) with only ${product.stockLevel} units in stock`,
                    metadata: { demandScore: composite, stockLevel: product.stockLevel },
                });
            }
        }

        console.log(`[Demand] ${signals} demand signals collected.`);
        return { signals };
    } catch (error) {
        console.error('[Demand] Error:', error.message);
        throw error;
    }
}

module.exports = { collectDemandSignals };
