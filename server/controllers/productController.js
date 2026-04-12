const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create({ ...req.body, userId: req.user._id });

        // --- Generate mockup historical data so graphs work immediately ---
        const COMPETITORS = ['Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Meesho'];
        
        for (let day = 30; day >= 0; day--) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            
            // Competitor Prices
            const numCompetitors = 2 + Math.floor(Math.random() * 3);
            const selected = [...COMPETITORS].sort(() => Math.random() - 0.5).slice(0, numCompetitors);
            for (const comp of selected) {
                const variance = (Math.random() - 0.45) * 0.3;
                await CompetitorPrice.create({
                    productId: product._id,
                    competitorName: comp,
                    competitorPrice: Math.round(product.currentPrice * (1 + variance) * 100) / 100,
                    inStock: Math.random() > 0.1,
                    timestamp: date,
                });
            }

            // Demand Signals
            await DemandSignal.create({
                productId: product._id,
                searchTrendScore: Math.round(20 + Math.random() * 70),
                weatherFactor: parseFloat(((Math.random() - 0.5) * 1.5).toFixed(2)),
                eventFactor: parseFloat(((Math.random() - 0.3) * 0.8).toFixed(2)),
                socialSentimentScore: parseFloat(((Math.random() - 0.3) * 1.2).toFixed(2)),
                timestamp: date,
            });
        }
        // -------------------------------------------------------------

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
