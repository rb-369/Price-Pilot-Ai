const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');

exports.getProducts = async (req, res) => {
    try {
        // Pagination params
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // Scoped to authenticated user
        const filter = { userId: req.user._id };

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({
            data: products,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const safeBody = { ...req.body };
        delete safeBody.userId;
        delete safeBody._id;

        const { name, sku, currentPrice, baseCost } = safeBody;
        if (!name || !sku || currentPrice === undefined || baseCost === undefined) {
             return res.status(400).json({ message: 'Name, SKU, currentPrice, and baseCost are required fields.' });
        }

        const product = await Product.create({ ...safeBody, userId: req.user._id });

        // Return immediately — generate mock data in background (non-blocking)
        res.status(201).json(product);

        // --- Fire-and-forget: Generate historical mock data so graphs work immediately ---
        _generateMockHistoricalData(product).catch(err => {
            console.error(`[ProductCreate] Background mock data generation failed for ${product._id}:`, err.message);
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        // Prevent Object Level Authorization / Mass Assignment
        // Ensure userId is not maliciously reassigned
        const safeBody = { ...req.body };
        delete safeBody.userId;
        delete safeBody._id;

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            safeBody,
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Also clean up related data
        await Promise.all([
            CompetitorPrice.deleteMany({ productId: product._id }),
            DemandSignal.deleteMany({ productId: product._id }),
        ]);

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Background helper: generate mock historical data ─────────────────────────
async function _generateMockHistoricalData(product) {
    const COMPETITORS = ['Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Meesho'];

    // Use bulkWrite for efficiency instead of individual creates
    const competitorOps = [];
    const demandOps = [];

    for (let day = 30; day >= 0; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        // Seeded randomness based on product ID + day for deterministic results
        const seed = (product._id.toString().charCodeAt(0) + day) / 100;

        // Competitor Prices
        const numCompetitors = 2 + Math.floor(((seed * 7919) % 1) * 3); // pseudo-random 2-4
        const shuffled = [...COMPETITORS].sort((a, b) => {
            const ha = a.charCodeAt(0) + day;
            const hb = b.charCodeAt(0) + day;
            return ha - hb;
        });
        const selected = shuffled.slice(0, Math.min(numCompetitors, COMPETITORS.length));

        for (const comp of selected) {
            const variance = (((comp.charCodeAt(0) + day) % 100) / 100 - 0.45) * 0.3;
            competitorOps.push({
                insertOne: {
                    document: {
                        productId: product._id,
                        competitorName: comp,
                        competitorPrice: Math.round(product.currentPrice * (1 + variance) * 100) / 100,
                        inStock: ((comp.charCodeAt(0) + day) % 10) > 1, // ~80% in stock
                        timestamp: date,
                    },
                },
            });
        }

        // Demand Signals
        const searchTrendScore = Math.round(20 + ((day * 31 + seed * 100) % 70));
        const weatherFactor = parseFloat((((day * 17 + seed * 50) % 150) / 100 - 0.75).toFixed(2));
        const eventFactor = parseFloat((((day * 13 + seed * 30) % 80) / 100 - 0.3).toFixed(2));
        const socialSentimentScore = parseFloat((((day * 23 + seed * 70) % 120) / 100 - 0.3).toFixed(2));
        
        const compositeDemandScore = 
            (searchTrendScore / 100) * 0.4 +
            ((weatherFactor + 1) / 2) * 0.2 +
            ((eventFactor + 1) / 2) * 0.2 +
            ((socialSentimentScore + 1) / 2) * 0.2;

        demandOps.push({
            insertOne: {
                document: {
                    productId: product._id,
                    searchTrendScore,
                    weatherFactor,
                    eventFactor,
                    socialSentimentScore,
                    compositeDemandScore,
                    timestamp: date,
                },
            },
        });
    }

    // Bulk insert for performance
    if (competitorOps.length > 0) {
        await CompetitorPrice.bulkWrite(competitorOps);
    }
    if (demandOps.length > 0) {
        await DemandSignal.bulkWrite(demandOps);
    }

    console.log(`[ProductCreate] Generated ${competitorOps.length} competitor prices + ${demandOps.length} demand signals for "${product.name}"`);
}
