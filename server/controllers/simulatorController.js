const axios = require('axios');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PriceHistory = require('../models/PriceHistory');
const Integration = require('../models/Integration');
const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

exports.runSimulation = async (req, res) => {
    try {
        const {
            productId,
            targetPrice,
            cogs,
            competitorStrategy = 'neutral',
            demandMultiplier = 1.0,
            timeHorizonDays = 30
        } = req.body;

        let productObj = {
            name: 'Sandbox Custom Product',
            sku: 'SANDBOX-001',
            baseCost: cogs !== undefined ? Number(cogs) : 50,
            currentPrice: targetPrice !== undefined ? Number(targetPrice) : 100,
            stockLevel: 100,
            reorderThreshold: 15,
            salesVelocity: { avgHourlySalesRate: 0.5 }
        };
        let competitorPrices = [];
        let demandSignals = [];

        if (productId) {
            const dbProduct = await Product.findOne({ _id: productId, userId: req.user._id });
            if (dbProduct) {
                productObj = {
                    name: dbProduct.name,
                    sku: dbProduct.sku,
                    baseCost: cogs !== undefined && cogs !== null ? Number(cogs) : dbProduct.baseCost,
                    currentPrice: dbProduct.currentPrice,
                    stockLevel: dbProduct.stockLevel,
                    reorderThreshold: dbProduct.reorderThreshold,
                    salesVelocity: dbProduct.salesVelocity || { avgHourlySalesRate: 0.5 }
                };

                const compDocs = await CompetitorPrice.find({ productId: dbProduct._id })
                    .sort({ timestamp: -1 })
                    .limit(10);
                competitorPrices = compDocs.map(c => ({
                    name: c.competitorName || 'Competitor',
                    price: c.competitorPrice,
                    productName: dbProduct.name,
                    inStock: c.inStock !== false
                }));

                const signalDocs = await DemandSignal.find({ productId: dbProduct._id })
                    .sort({ timestamp: -1 })
                    .limit(10);
                demandSignals = signalDocs.map(s => ({
                    compositeDemandScore: s.compositeDemandScore || 0.5,
                    searchTrendScore: s.searchTrendScore || 50
                }));
            }
        }

        const simTargetPrice = targetPrice !== undefined && targetPrice !== null ? Number(targetPrice) : productObj.currentPrice;

        const payload = {
            user_id: req.user._id.toString(),
            product: productObj,
            competitorPrices: competitorPrices,
            demandSignals: demandSignals,
            targetPrice: simTargetPrice,
            cogs: cogs !== undefined && cogs !== null ? Number(cogs) : productObj.baseCost,
            competitorStrategy: competitorStrategy,
            demandMultiplier: Number(demandMultiplier),
            timeHorizonDays: Number(timeHorizonDays)
        };

        try {
            const aiResponse = await axios.post(`${AI_URL}/api/simulate`, payload);
            return res.json(aiResponse.data);
        } catch (aiErr) {
            console.error('Python AI Simulation Service unavailable/failed:', aiErr.message);
            // Fallback Node-side mock simulation if microservice is offline
            const basePrice = productObj.currentPrice || 100;
            const unitCogs = payload.cogs;
            const baselineVol = (productObj.salesVelocity?.avgHourlySalesRate || 0.5) * 24 * timeHorizonDays;
            const volFactor = Math.max(0.2, Math.min(2.5, Math.pow(simTargetPrice / basePrice, -1.2) * demandMultiplier));
            const simVol = baselineVol * volFactor;
            const simRev = simTargetPrice * simVol;
            const simProf = (simTargetPrice - unitCogs) * simVol;

            return res.json({
                product: productObj,
                simulationParams: payload,
                baseline: {
                    price: basePrice,
                    volume: Math.round(baselineVol),
                    revenue: Math.round(basePrice * baselineVol),
                    profit: Math.round((basePrice - unitCogs) * baselineVol),
                    marginPct: Math.round(((basePrice - unitCogs) / basePrice) * 100)
                },
                simulated: {
                    price: simTargetPrice,
                    predictedVolume: Math.round(simVol),
                    predictedRevenue: Math.round(simRev),
                    predictedProfit: Math.round(simProf),
                    marginPct: Math.round(((simTargetPrice - unitCogs) / simTargetPrice) * 100),
                    undercutRisk: 25.0,
                    effectiveElasticity: -1.2,
                    confidenceBounds: {
                        revenueP10: Math.round(simRev * 0.85),
                        revenueP90: Math.round(simRev * 1.15),
                        profitP10: Math.round(simProf * 0.85),
                        profitP90: Math.round(simProf * 1.15)
                    }
                },
                deltas: {
                    revenueUplift: Math.round(simRev - basePrice * baselineVol),
                    profitUplift: Math.round(simProf - (basePrice - unitCogs) * baselineVol)
                },
                optimalPricePoint: { price: Math.round(basePrice * 1.05), maxProfit: Math.round(simProf * 1.1) },
                competitorSummary: { average: basePrice, min: basePrice * 0.9, max: basePrice * 1.1, count: 2 },
                presets: {}
            });
        }
    } catch (error) {
        console.error('Simulator controller error:', error.message);
        return res.status(500).json({ message: 'Simulation error', error: error.message });
    }
};

exports.commitPriceChange = async (req, res) => {
    try {
        const { productId, newPrice, cogs, simulationParams } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required to commit price change' });
        }

        const product = await Product.findOne({ _id: productId, userId: req.user._id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const oldPrice = product.currentPrice;
        product.currentPrice = Number(newPrice);
        if (cogs !== undefined && cogs !== null) {
            product.baseCost = Number(cogs);
        }
        await product.save();

        // Create Price History Audit Entry
        try {
            await PriceHistory.create({
                productId: product._id,
                userId: req.user._id,
                price: Number(newPrice),
                oldPrice: oldPrice,
                changeReason: 'What-If Simulation Commit',
                metadata: simulationParams || {}
            });
        } catch (phErr) {
            console.warn('Could not record PriceHistory log:', phErr.message);
        }

        // Trigger Multi-Channel Push if sync is active
        let channelSyncResults = { shopify: 'none', amazon: 'none', flipkart: 'none' };

        if (product.syncEnabled !== false && product.source === 'shopify' && product.externalIds?.shopifyId) {
            const integration = await Integration.findOne({ userId: req.user._id, platform: 'shopify', status: 'active' });
            if (integration) {
                try {
                    const variantId = product.externalIds.shopifyId;
                    await axios.put(
                        `https://${integration.shopUrl}/admin/api/2024-01/variants/${variantId}.json`,
                        { variant: { id: variantId, price: newPrice.toString() } },
                        { headers: { 'X-Shopify-Access-Token': integration.accessToken } }
                    );
                    channelSyncResults.shopify = 'synced';
                } catch (syncErr) {
                    console.error('Failed to sync simulator price to Shopify:', syncErr.message);
                    channelSyncResults.shopify = 'failed';
                }
            }
        }

        return res.json({
            message: 'Price updated successfully via What-If Simulator',
            product,
            oldPrice,
            newPrice,
            channelSyncResults
        });
    } catch (error) {
        console.error('Commit price change error:', error.message);
        return res.status(500).json({ message: 'Failed to commit price change', error: error.message });
    }
};
