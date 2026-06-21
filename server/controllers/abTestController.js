const ABTest = require('../models/ABTest');
const Product = require('../models/Product');

// Chi-Square test for statistical significance
function calculateSignificance(conversionsA, viewsA, conversionsB, viewsB) {
    if (viewsA === 0 || viewsB === 0) return 0;
    
    const rateA = conversionsA / viewsA;
    const rateB = conversionsB / viewsB;
    
    // Very simplified Z-test approximation for statistical significance
    const pPool = (conversionsA + conversionsB) / (viewsA + viewsB);
    if (pPool === 0 || pPool === 1) return 0;
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1/viewsA + 1/viewsB));
    const z = Math.abs(rateA - rateB) / se;
    
    // Z to roughly confidence %
    if (z >= 2.576) return 99;
    if (z >= 1.96) return 95;
    if (z >= 1.645) return 90;
    if (z >= 1.28) return 80;
    
    return Math.round((1 - Math.exp(-0.717 * z - 0.416 * z * z)) * 100);
}

exports.createTest = async (req, res) => {
    try {
        const { productId, variantBPrice } = req.body;
        
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
            variantA: { price: product.currentPrice, label: 'control' },
            variantB: { price: variantBPrice, label: 'ai_recommended' },
            status: 'active'
        });
        
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
        const { variant, eventType } = req.body; // variant: 'A' or 'B', eventType: 'view' or 'conversion'
        
        const test = await ABTest.findOne({ _id: id });
        if (!test || test.status !== 'active') return res.status(400).json({ message: 'Active test not found' });
        
        const vKey = variant === 'A' ? 'variantA' : 'variantB';
        
        if (eventType === 'view') {
            test.results[vKey].views += 1;
        } else if (eventType === 'conversion') {
            test.results[vKey].conversions += 1;
            test.results[vKey].revenue += test[vKey].price;
        }
        
        // Update statistical significance every 10 views to save CPU
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
        
        // If there's a clear winner, update the product price automatically
        if (test.winner === 'A' || test.winner === 'B') {
            const winningPrice = test.winner === 'A' ? test.variantA.price : test.variantB.price;
            await Product.findByIdAndUpdate(test.productId, { currentPrice: winningPrice });
        }
        
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
