const ABTest = require('../models/ABTest');
const Product = require('../models/Product');
const PricingRecommendation = require('../models/PricingRecommendation');

// Chi-Square test for statistical significance
function calculateSignificance(conversionsA, viewsA, conversionsB, viewsB) {
    if (viewsA === 0 || viewsB === 0) return 0;
    
    const rateA = conversionsA / viewsA;
    const rateB = conversionsB / viewsB;
    
    const pPool = (conversionsA + conversionsB) / (viewsA + viewsB);
    if (pPool === 0 || pPool === 1) return 0;
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1/viewsA + 1/viewsB));
    const z = Math.abs(rateA - rateB) / se;
    
    if (z >= 2.576) return 99;
    if (z >= 1.96) return 95;
    if (z >= 1.645) return 90;
    if (z >= 1.28) return 80;
    
    return Math.round((1 - Math.exp(-0.717 * z - 0.416 * z * z)) * 100);
}

exports.createTest = async (req, res) => {
    try {
        const { productId, variantBPrice, recommendationId } = req.body;
        
        const product = await Product.findOne({ _id: productId, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        // Stop any existing active tests for this product
        await ABTest.updateMany(
            { productId, status: 'active' },
            { status: 'completed', endDate: new Date() }
        );
        
        const test = await ABTest.create({
            productId,
            userId: req.user._id,
            recommendationId: recommendationId || null,
            variantA: { price: product.currentPrice, label: 'control' },
            variantB: { price: variantBPrice, label: 'ai_recommended' },
            status: 'active'
        });

        // Update recommendation status to in_testing if recommendationId provided
        if (recommendationId) {
            await PricingRecommendation.findByIdAndUpdate(recommendationId, { status: 'in_testing' });
        }
        
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTests = async (req, res) => {
    try {
        const tests = await ABTest.find({ userId: req.user._id })
            .populate('productId', 'name sku')
            .sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTest = async (req, res) => {
    try {
        const test = await ABTest.findOne({ _id: req.params.id, userId: req.user._id })
            .populate('productId', 'name sku');
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.recordEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { variant, eventType } = req.body;
        
        const test = await ABTest.findOne({ _id: id });
        if (!test || test.status !== 'active') return res.status(400).json({ message: 'Active test not found' });
        
        const vKey = variant === 'A' ? 'variantA' : 'variantB';
        
        if (eventType === 'view') {
            test.results[vKey].views += 1;
        } else if (eventType === 'conversion') {
            test.results[vKey].conversions += 1;
            test.results[vKey].revenue += test[vKey].price;
        }
        
        if (test.results.variantA.views % 10 === 0 || test.results.variantB.views % 10 === 0) {
            test.confidenceLevel = calculateSignificance(
                test.results.variantA.conversions, test.results.variantA.views,
                test.results.variantB.conversions, test.results.variantB.views
            );
        }
        
        await test.save();
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.completeTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accept' or 'reject'
        
        const test = await ABTest.findOne({ _id: id, userId: req.user._id });
        if (!test) return res.status(404).json({ message: 'Test not found' });
        
        test.status = 'completed';
        test.endDate = new Date();
        
        // Determine winner based on revenue per view (RPV)
        const rpvA = test.results.variantA.views > 0 ? test.results.variantA.revenue / test.results.variantA.views : 0;
        const rpvB = test.results.variantB.views > 0 ? test.results.variantB.revenue / test.results.variantB.views : 0;
        
        if (rpvA > rpvB * 1.05) test.winner = 'A';
        else if (rpvB > rpvA * 1.05) test.winner = 'B';
        else test.winner = 'tie';
        
        await test.save();
        
        const isAccept = action !== 'reject';
        if (isAccept) {
            // Apply winning price to store catalog
            const winningPrice = test.winner === 'B' ? test.variantB.price : test.variantA.price;
            await Product.findByIdAndUpdate(test.productId, { currentPrice: winningPrice });
            
            if (test.recommendationId) {
                await PricingRecommendation.findByIdAndUpdate(test.recommendationId, { status: 'accepted' });
            }
        } else {
            // Retain original Control price (Variant A)
            await Product.findByIdAndUpdate(test.productId, { currentPrice: test.variantA.price });
            
            if (test.recommendationId) {
                await PricingRecommendation.findByIdAndUpdate(test.recommendationId, { status: 'rejected' });
            }
        }
        
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.simulateTraffic = async (req, res) => {
    try {
        const { id } = req.params;
        const count = parseInt(req.body.count || 50, 10);
        
        const test = await ABTest.findOne({ _id: id, userId: req.user._id });
        if (!test || test.status !== 'active') return res.status(400).json({ message: 'Active test not found' });
        
        // Simulate batch shopper traffic split 50/50 between Variant A and Variant B
        const countA = Math.floor(count / 2);
        const countB = count - countA;
        
        // Variant A ~ 8-12% conversion rate, Variant B ~ 12-18% conversion rate
        const convRateA = 0.08 + Math.random() * 0.04;
        const convRateB = 0.12 + Math.random() * 0.06;
        
        const convsA = Math.round(countA * convRateA);
        const convsB = Math.round(countB * convRateB);
        
        test.results.variantA.views += countA;
        test.results.variantA.conversions += convsA;
        test.results.variantA.revenue += convsA * test.variantA.price;
        
        test.results.variantB.views += countB;
        test.results.variantB.conversions += convsB;
        test.results.variantB.revenue += convsB * test.variantB.price;
        
        test.confidenceLevel = calculateSignificance(
            test.results.variantA.conversions, test.results.variantA.views,
            test.results.variantB.conversions, test.results.variantB.views
        );
        
        await test.save();
        res.json({ message: `Simulated ${count} visitor sessions`, test });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
