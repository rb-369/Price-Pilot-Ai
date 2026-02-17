/**
 * Demand Signal Simulator
 * Simulates: Google Trends, Weather, Events, Social Sentiment
 */
const DemandSignal = require('../models/DemandSignal');
const Product = require('../models/Product');
const Alert = require('../models/Alert');

function generateDemandSignals() {
    const day = new Date().getDay();
    const month = new Date().getMonth();

    return {
        searchTrendScore: Math.round(30 + Math.random() * 60 + (day === 0 || day === 6 ? 10 : 0)),
        weatherFactor: parseFloat(((Math.random() - 0.5) * 1.5).toFixed(2)),
        eventFactor: parseFloat(((month === 10 || month === 11) ? 0.3 + Math.random() * 0.5 : (Math.random() - 0.3) * 0.6).toFixed(2)),
        socialSentimentScore: parseFloat(((Math.random() - 0.3) * 1.2).toFixed(2)),
    };
}

async function collectDemandSignals() {
    console.log('[Demand] Collecting demand signals...');
    try {
        const products = await Product.find({});
        let signals = 0;

        for (const product of products) {
            const signalData = generateDemandSignals();
            await DemandSignal.create({
                productId: product._id,
                ...signalData,
            });
            signals++;

            // Alert if demand is surging
            const composite =
                (signalData.searchTrendScore / 100) * 0.4 +
                ((signalData.weatherFactor + 1) / 2) * 0.2 +
                ((signalData.eventFactor + 1) / 2) * 0.2 +
                ((signalData.socialSentimentScore + 1) / 2) * 0.2;

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
