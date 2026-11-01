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
            let dbProduct = await Product.findOne({ _id: productId, userId: req.user._id });
            if (!dbProduct) {
                dbProduct = await Product.findById(productId);
            }
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

                const userBrand = (dbProduct.brand || dbProduct.fullName || dbProduct.name || '').split(/[,|\-–—\s]/)[0].trim().toLowerCase();
                const compDocs = await CompetitorPrice.find({ productId: dbProduct._id })
                    .sort({ timestamp: -1 })
                    .limit(10);
                competitorPrices = compDocs
                    .filter(c => {
                        if (!userBrand || userBrand.length < 3) return true;
                        const pName = (c.productName || '').toLowerCase();
                        const cName = (c.competitorName || '').toLowerCase();
                        return !pName.includes(userBrand) && !cName.includes(userBrand);
                    })
                    .map(c => ({
                        name: c.competitorName || 'Competitor',
                        price: c.competitorPrice,
                        productName: c.productName || dbProduct.name,
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
            const pRatio = simTargetPrice / (basePrice || 1);
            let rawVolFactor = Math.pow(pRatio, -1.3) * demandMultiplier;
            if (pRatio > 3.0) {
                rawVolFactor = Math.max(0.0001, Math.min(2.5, rawVolFactor * (3.0 / pRatio)));
            } else if (pRatio > 1.5) {
                rawVolFactor = Math.max(0.005, Math.min(2.5, rawVolFactor));
            } else {
                rawVolFactor = Math.max(0.02, Math.min(2.5, rawVolFactor));
            }
            const volFactor = rawVolFactor;
            const simVol = baselineVol * volFactor;
            const simRev = simTargetPrice * simVol;
            const simProf = (simTargetPrice - unitCogs) * simVol;
            const isSevereHike = simTargetPrice > basePrice * 1.5;
            const undercutRisk = isSevereHike ? Math.min(99.0, 80.0 + (pRatio - 1.5) * 15.0) : (simTargetPrice > basePrice ? 45.0 : 15.0);

            const baselineRev = basePrice * baselineVol;
            const baselineProf = (basePrice - unitCogs) * baselineVol;
            const revenueUplift = simRev - baselineRev;
            const profitUplift = simProf - baselineProf;
            const revenueUpliftPct = baselineRev > 0 ? (revenueUplift / baselineRev) * 100 : 0;
            const profitUpliftPct = baselineProf > 0 ? (profitUplift / baselineProf) * 100 : 0;
            const volumeChangePct = baselineVol > 0 ? ((simVol - baselineVol) / baselineVol) * 100 : 0;
            const breakevenVolume = (simTargetPrice - unitCogs) > 0 ? Math.round(baselineProf / (simTargetPrice - unitCogs)) : 0;

            let verdictLabel = "HOLD / NEUTRAL";
            let verdictType = "warning";
            let verdictSummary = "Proposed price shows minimal impact on net profitability.";

            if (profitUplift > 0 && profitUpliftPct >= 5) {
                verdictLabel = "FAVORABLE HIKE";
                verdictType = "positive";
                verdictSummary = `Projected profit increase of +${profitUpliftPct.toFixed(1)}% (+₹${Math.round(profitUplift).toLocaleString()}) despite volume change.`;
            } else if (profitUplift < 0 && profitUpliftPct <= -5) {
                verdictLabel = "MARGIN RISK";
                verdictType = "negative";
                verdictSummary = `Projected profit decline of ${profitUpliftPct.toFixed(1)}% (-₹${Math.round(Math.abs(profitUplift)).toLocaleString()}). Consider a lower price shift.`;
            } else if (simTargetPrice < basePrice && revenueUplift > 0) {
                verdictLabel = "VOLUME PUSH";
                verdictType = "positive";
                verdictSummary = `Lower price stimulates demand (+${Math.round(volumeChangePct)}% volume), driving revenue growth.`;
            }

            // Generate sensitivity curve across 25 price intervals (matching Python service)
            const sensitivityCurve = [];
            let bestPrice = basePrice;
            let maxProfit = -Infinity;
            const stepCount = 25;
            const minP = Math.max(Math.round(unitCogs * 1.02), Math.round(basePrice * 0.6));
            const maxP = Math.round(basePrice * 1.6);
            const stepSize = Math.max(1, (maxP - minP) / (stepCount - 1));

            for (let i = 0; i < stepCount; i++) {
                const p = Math.round((minP + i * stepSize) * 100) / 100;
                const ratio = p / (basePrice || 1);
                let sf = Math.pow(ratio, -1.2) * demandMultiplier;
                if (ratio > 3.0) sf = Math.max(0.0001, sf * (3.0 / ratio));
                else if (ratio > 1.5) sf = Math.max(0.005, sf);
                else sf = Math.max(0.02, sf);
                const stepVol = baselineVol * sf;
                const stepRev = Math.round(p * stepVol * 100) / 100;
                const stepProf = Math.round((p - unitCogs) * stepVol * 100) / 100;
                sensitivityCurve.push({
                    price: p,
                    volume: Math.round(stepVol),
                    revenue: stepRev,
                    profit: stepProf,
                    marginPct: p > 0 ? Math.round(((p - unitCogs) / p) * 1000) / 10 : 0
                });
                if (stepProf > maxProfit) {
                    maxProfit = stepProf;
                    bestPrice = p;
                }
            }

            const presets = {
                maximize_margin: {
                    name: "Maximize Profit Margin (P*)",
                    targetPrice: bestPrice,
                    cogs: unitCogs,
                    competitorStrategy: "neutral",
                    demandMultiplier: demandMultiplier
                },
                market_growth: {
                    name: "Market Share Growth (-8%)",
                    targetPrice: Math.max(Math.round(unitCogs * 1.05), Math.round(basePrice * 0.92)),
                    cogs: unitCogs,
                    competitorStrategy: "follower",
                    demandMultiplier: Math.min(2.0, demandMultiplier * 1.1)
                },
                defend_undercut: {
                    name: "Defend Undercut Match",
                    targetPrice: Math.max(Math.round(unitCogs * 1.02), Math.round(basePrice * 0.95)),
                    cogs: unitCogs,
                    competitorStrategy: "aggressive",
                    demandMultiplier: demandMultiplier
                },
                inflation_passthrough: {
                    name: "Cost Passthrough (+10%)",
                    targetPrice: Math.round(basePrice * 1.1),
                    cogs: Math.round(unitCogs * 1.08),
                    competitorStrategy: "neutral",
                    demandMultiplier: demandMultiplier
                }
            };

            return res.json({
                product: productObj,
                simulationParams: payload,
                aiVerdict: {
                    label: verdictLabel,
                    type: verdictType,
                    summary: verdictSummary
                },
                baseline: {
                    price: basePrice,
                    volume: Math.round(baselineVol),
                    revenue: Math.round(baselineRev),
                    profit: Math.round(baselineProf),
                    marginPct: Math.round(((basePrice - unitCogs) / basePrice) * 100)
                },
                simulated: {
                    price: simTargetPrice,
                    predictedVolume: Math.round(simVol),
                    predictedRevenue: Math.round(simRev),
                    predictedProfit: Math.round(simProf),
                    marginPct: Math.round(((simTargetPrice - unitCogs) / simTargetPrice) * 100),
                    undercutRisk: Math.round(undercutRisk),
                    effectiveElasticity: -1.2,
                    confidenceBounds: {
                        revenueP10: Math.round(simRev * 0.85),
                        revenueP90: Math.round(simRev * 1.15),
                        profitP10: Math.round(simProf * 0.85),
                        profitP90: Math.round(simProf * 1.15)
                    }
                },
                deltas: {
                    revenueUplift: Math.round(revenueUplift),
                    revenueUpliftPct: Math.round(revenueUpliftPct * 10) / 10,
                    profitUplift: Math.round(profitUplift),
                    profitUpliftPct: Math.round(profitUpliftPct * 10) / 10,
                    volumeChangePct: Math.round(volumeChangePct * 10) / 10,
                    breakevenVolume: breakevenVolume
                },
                optimalPricePoint: { price: bestPrice, maxProfit: Math.round(maxProfit) },
                competitorSummary: {
                    average: competitorPrices.length ? Math.round(competitorPrices.reduce((a, b) => a + b.price, 0) / competitorPrices.length) : basePrice,
                    min: competitorPrices.length ? Math.min(...competitorPrices.map(c => c.price)) : Math.round(basePrice * 0.9),
                    max: competitorPrices.length ? Math.max(...competitorPrices.map(c => c.price)) : Math.round(basePrice * 1.1),
                    count: competitorPrices.length
                },
                elasticityModel: {
                    baseElasticity: -1.2,
                    effectiveElasticity: -1.2,
                    source: "node_engine_fallback"
                },
                sensitivityCurve: sensitivityCurve,
                presets: presets
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

        let product = await Product.findOne({ _id: productId, userId: req.user._id });
        if (!product) {
            product = await Product.findById(productId);
        }
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
