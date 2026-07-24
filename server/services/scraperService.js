/**
 * Competitor Price Scraper Service
 * 
 * Strategy:
 *   1. Try to fetch REAL competitor data from the AI service's Rainforest API integration
 *   2. Fall back to simulated data if the AI service is unavailable or returns empty results
 *   3. Log which path was used for transparency
 */
const axios = require('axios');
const CompetitorPrice = require('../models/CompetitorPrice');
const Product = require('../models/Product');
const Alert = require('../models/Alert');

const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

// Simulated competitor data — used as fallback when real API is unavailable
const COMPETITORS = ['Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Meesho'];

function generateSimulatedPrice(basePrice) {
    const variance = (Math.random() - 0.45) * 0.3; // -15% to +15% variance
    return Math.round(basePrice * (1 + variance) * 100) / 100;
}

/**
 * Try to fetch live competitor data from the AI service's Rainforest API endpoint.
 * Returns null if the AI service is unreachable or returns no results.
 */
async function _fetchLiveCompetitors(productName, basePrice) {
    try {
        const response = await axios.post(`${AI_URL}/api/scrape/search`, {
            keyword: productName,
            amazonDomain: 'amazon.in',
            maxResults: 5,
            basePriceForMock: basePrice,
        }, { timeout: 25000 });

        const competitors = response.data?.competitors || [];
        if (competitors.length === 0) return null;

        console.log(`[Scraper] ✅ Got ${competitors.length} live results for "${productName}" (source: ${response.data.source})`);
        return competitors;
    } catch (err) {
        console.log(`[Scraper] ⚠️ Live fetch failed for "${productName}": ${err.message} — using simulation`);
        return null;
    }
}

async function scrapeCompetitorPrices() {
    console.log('[Scraper] Starting competitor price scrape...');
    try {
        const products = await Product.find({});
        let newPrices = 0;
        let alertsCreated = 0;
        let liveCount = 0;
        let simCount = 0;

        for (const product of products) {
            // --- Attempt real API first ---
            const liveCompetitors = await _fetchLiveCompetitors(product.name, product.currentPrice);

            if (liveCompetitors) {
                // Use real Rainforest API data
                liveCount++;
                for (const comp of liveCompetitors) {
                    await CompetitorPrice.create({
                        productId: product._id,
                        competitorName: comp.platform || 'Amazon',
                        productName: comp.productName?.substring(0, 150) || 'Unknown Product',
                        competitorUrl: comp.url || '',
                        competitorPrice: comp.price,
                        inStock: comp.inStock !== false,
                    });
                    newPrices++;

                    // Alert: competitor undercuts our price
                    if (comp.price < product.currentPrice * 0.95) {
                        await Alert.create({
                            productId: product._id,
                            type: 'competitor_undercut',
                            severity: 'high',
                            title: `Price Alert: ${product.name}`,
                            message: `${comp.platform} is selling at ₹${comp.price} (${((1 - comp.price / product.currentPrice) * 100).toFixed(1)}% lower than your ₹${product.currentPrice})`,
                            metadata: { competitor: comp.platform, competitorPrice: comp.price, ourPrice: product.currentPrice, source: 'rainforest_api' },
                        });
                        alertsCreated++;
                    }
                }
            } else {
                // No live data available — skip this product, do NOT store mock/simulated data
                simCount++;
                console.log(`[Scraper] ⚠️ No live competitor data for "${product.name}" — skipping (no mock data stored)`);
            }
        }

        console.log(`[Scraper] Done. ${newPrices} prices recorded, ${alertsCreated} alerts created. (${liveCount} live, ${simCount} simulated)`);
        return { newPrices, alertsCreated, liveCount, simCount };
    } catch (error) {
        console.error('[Scraper] Error:', error.message);
        throw error;
    }
}

module.exports = { scrapeCompetitorPrices };
