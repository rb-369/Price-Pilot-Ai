const axios = require('axios');
const Alert = require('../models/Alert');
const CompetitorPrice = require('../models/CompetitorPrice');
const Product = require('../models/Product');
const { sendUserStreamEvent } = require('../routes/stream');

const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

async function fetchLiveCompetitorsForProduct(product) {
    let response;

    try {
        response = await axios.post(
            `${AI_URL}/api/scrape/search`,
            { 
                keyword: product.fullName || product.shortName || product.name, 
                brand: product.brand || '',
                category: product.category || 'General',
                price: product.currentPrice,
                amazonDomain: 'amazon.in', 
                maxResults: 6,
                asin: product.externalIds?.amazonAsin || undefined
            },
            { timeout: 25000 },
        );
    } catch (error) {
        throw new Error(`Live price fetch failed: ${error.message}`);
    }

    if (response.data?.source !== 'rainforest_api') {
        throw new Error('Live price source was not verified');
    }

    const competitors = (response.data.competitors || []).filter((competitor) =>
        Number.isFinite(Number(competitor.price)) &&
        competitor.productName &&
        competitor.url,
    );

    if (!competitors.length) {
        return {
            checkedAt: new Date().toISOString(),
            competitors: [],
        };
    }

    const checkedAt = new Date();
    const records = await CompetitorPrice.insertMany(competitors.map((competitor) => {
        const platformStr = competitor.platform || 'Amazon';
        const brandStr = competitor.brand && competitor.brand !== 'Other' ? competitor.brand : '';
        const nameLabel = brandStr ? `${brandStr} (${platformStr})` : platformStr;

        return {
            productId: product._id,
            competitorName: nameLabel,
            productName: competitor.productName.slice(0, 150),
            competitorUrl: competitor.url,
            competitorPrice: Number(competitor.price),
            inStock: competitor.inStock !== false,
            timestamp: checkedAt,
        };
    }));

    for (const record of records) {
        if (record.competitorPrice < product.currentPrice * 0.95) {
            const title = `Price Alert: ${product.name}`;
            const message = `${record.competitorName} is selling at Rs. ${record.competitorPrice} (undercutting your Rs. ${product.currentPrice})`;

            await Alert.create({
                productId: product._id,
                userId: product.userId,
                type: 'competitor_undercut',
                severity: 'high',
                title,
                message,
                metadata: {
                    competitor: record.competitorName,
                    competitorPrice: record.competitorPrice,
                    ourPrice: product.currentPrice,
                    source: 'rainforest_api',
                },
            });

            sendUserStreamEvent(product.userId, {
                type: 'alert',
                severity: 'high',
                title,
                message,
                productId: product._id,
                actionUrl: '/dashboard/competitors'
            });
        }
    }

    return {
        checkedAt: checkedAt.toISOString(),
        competitors: records.map((record) => ({
            name: record.competitorName,
            productName: record.productName,
            url: record.competitorUrl,
            price: record.competitorPrice,
            inStock: record.inStock,
            timestamp: record.timestamp,
        })),
    };
}

async function scrapeCompetitorPrices() {
    const products = await Product.find({});
    let successfulProducts = 0;
    let failedProducts = 0;

    for (const product of products) {
        try {
            await fetchLiveCompetitorsForProduct(product);
            successfulProducts += 1;
        } catch (error) {
            failedProducts += 1;
            console.warn(`[Scraper] ${product.name}: ${error.message}`);
        }
    }

    return { successfulProducts, failedProducts };
}

module.exports = { fetchLiveCompetitorsForProduct, scrapeCompetitorPrices };
