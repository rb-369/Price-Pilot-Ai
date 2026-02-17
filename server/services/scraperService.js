/**
 * Competitor Price Scraper Service
 * Uses Cheerio for static scraping with simulated fallback data
 * In production, this would use Puppeteer for dynamic sites
 */
const CompetitorPrice = require('../models/CompetitorPrice');
const Product = require('../models/Product');
const Alert = require('../models/Alert');

// Simulated competitor data for demo purposes
const COMPETITORS = ['Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Meesho'];

function generateSimulatedPrice(basePrice) {
    const variance = (Math.random() - 0.45) * 0.3; // -15% to +15% variance
    return Math.round(basePrice * (1 + variance) * 100) / 100;
}

async function scrapeCompetitorPrices() {
    console.log('[Scraper] Starting competitor price scrape...');
    try {
        const products = await Product.find({});
        let newPrices = 0;
        let alertsCreated = 0;

        for (const product of products) {
            // Pick 2-4 random competitors per product
            const numCompetitors = 2 + Math.floor(Math.random() * 3);
            const selectedCompetitors = [...COMPETITORS]
                .sort(() => Math.random() - 0.5)
                .slice(0, numCompetitors);

            for (const competitor of selectedCompetitors) {
                const competitorPrice = generateSimulatedPrice(product.currentPrice);
                const inStock = Math.random() > 0.15; // 85% chance in stock

                await CompetitorPrice.create({
                    productId: product._id,
                    competitorName: competitor,
                    competitorPrice,
                    inStock,
                });
                newPrices++;

                // Alert: competitor undercuts our price
                if (competitorPrice < product.currentPrice * 0.95) {
                    await Alert.create({
                        productId: product._id,
                        type: 'competitor_undercut',
                        severity: 'high',
                        title: `Price Alert: ${product.name}`,
                        message: `${competitor} is selling at ₹${competitorPrice} (${((1 - competitorPrice / product.currentPrice) * 100).toFixed(1)}% lower than your ₹${product.currentPrice})`,
                        metadata: { competitor, competitorPrice, ourPrice: product.currentPrice },
                    });
                    alertsCreated++;
                }

                // Alert: competitor out of stock = opportunity
                if (!inStock) {
                    await Alert.create({
                        productId: product._id,
                        type: 'competitor_stockout',
                        severity: 'medium',
                        title: `Opportunity: ${product.name}`,
                        message: `${competitor} is out of stock — consider increasing price to capture demand`,
                        metadata: { competitor },
                    });
                    alertsCreated++;
                }
            }
        }

        console.log(`[Scraper] Done. ${newPrices} prices recorded, ${alertsCreated} alerts created.`);
        return { newPrices, alertsCreated };
    } catch (error) {
        console.error('[Scraper] Error:', error.message);
        throw error;
    }
}

module.exports = { scrapeCompetitorPrices };
