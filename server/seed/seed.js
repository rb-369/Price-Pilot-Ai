require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const CompetitorPrice = require('../models/CompetitorPrice');
const DemandSignal = require('../models/DemandSignal');
const PricingRecommendation = require('../models/PricingRecommendation');
const InventoryForecast = require('../models/InventoryForecast');
const Alert = require('../models/Alert');

const PRODUCTS = [
    { name: 'Wireless Bluetooth Earbuds', sku: 'WBE-001', category: 'Electronics', baseCost: 450, currentPrice: 999, minMargin: 0.15, stockLevel: 150, reorderThreshold: 30 },
    { name: 'Organic Green Tea (100g)', sku: 'OGT-002', category: 'Groceries', baseCost: 80, currentPrice: 199, minMargin: 0.12, stockLevel: 500, reorderThreshold: 100 },
    { name: 'Running Shoes Pro', sku: 'RSP-003', category: 'Footwear', baseCost: 1200, currentPrice: 2499, minMargin: 0.2, stockLevel: 75, reorderThreshold: 15 },
    { name: 'Stainless Steel Water Bottle', sku: 'SSW-004', category: 'Home', baseCost: 180, currentPrice: 399, minMargin: 0.1, stockLevel: 300, reorderThreshold: 50 },
    { name: 'USB-C Fast Charger 65W', sku: 'UFC-005', category: 'Electronics', baseCost: 350, currentPrice: 799, minMargin: 0.15, stockLevel: 200, reorderThreshold: 40 },
    { name: 'Cotton T-Shirt (Unisex)', sku: 'CTS-006', category: 'Apparel', baseCost: 150, currentPrice: 349, minMargin: 0.12, stockLevel: 400, reorderThreshold: 80 },
    { name: 'Yoga Mat Premium', sku: 'YMP-007', category: 'Fitness', baseCost: 400, currentPrice: 899, minMargin: 0.18, stockLevel: 120, reorderThreshold: 25 },
    { name: 'Portable Umbrella', sku: 'PUM-008', category: 'Accessories', baseCost: 100, currentPrice: 249, minMargin: 0.1, stockLevel: 350, reorderThreshold: 70 },
    { name: 'Wireless Mouse Ergonomic', sku: 'WME-009', category: 'Electronics', baseCost: 280, currentPrice: 599, minMargin: 0.15, stockLevel: 180, reorderThreshold: 35 },
    { name: 'Protein Bar Pack (12pcs)', sku: 'PBP-010', category: 'Groceries', baseCost: 200, currentPrice: 449, minMargin: 0.12, stockLevel: 250, reorderThreshold: 50 },
];

const COMPETITORS = ['Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Meesho'];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}), Product.deleteMany({}), CompetitorPrice.deleteMany({}),
            DemandSignal.deleteMany({}), PricingRecommendation.deleteMany({}),
            InventoryForecast.deleteMany({}), Alert.deleteMany({}),
        ]);
        console.log('Cleared existing data');

        // Create admin user
        const admin = await User.create({
            name: 'Admin User', email: 'admin@ecom.ai',
            password: 'admin123', role: 'admin', storeType: 'multi-category',
        });
        await User.create({
            name: 'Store Manager', email: 'manager@ecom.ai',
            password: 'manager123', role: 'user', storeType: 'electronics',
        });
        console.log('Users created');

        // Create products
        const products = await Product.insertMany(
            PRODUCTS.map(p => ({ ...p, userId: admin._id }))
        );
        console.log(`${products.length} products created`);

        // Generate 30 days of competitor price history
        for (const product of products) {
            for (let day = 30; day >= 0; day--) {
                const date = new Date();
                date.setDate(date.getDate() - day);
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
            }
        }
        console.log('Competitor price history generated');

        // Generate 30 days of demand signals
        for (const product of products) {
            for (let day = 30; day >= 0; day--) {
                const date = new Date();
                date.setDate(date.getDate() - day);
                await DemandSignal.create({
                    productId: product._id,
                    searchTrendScore: Math.round(20 + Math.random() * 70),
                    weatherFactor: parseFloat(((Math.random() - 0.5) * 1.5).toFixed(2)),
                    eventFactor: parseFloat(((Math.random() - 0.3) * 0.8).toFixed(2)),
                    socialSentimentScore: parseFloat(((Math.random() - 0.3) * 1.2).toFixed(2)),
                    timestamp: date,
                });
            }
        }
        console.log('Demand signal history generated');

        // Sample recommendations
        for (const product of products.slice(0, 5)) {
            const priceChange = (Math.random() - 0.3) * 0.15;
            const recPrice = Math.round(product.currentPrice * (1 + priceChange));
            await PricingRecommendation.create({
                productId: product._id,
                recommendedPrice: recPrice,
                currentPrice: product.currentPrice,
                reason: priceChange > 0
                    ? `Increase price by ${(priceChange * 100).toFixed(1)}% — competitor stockout detected and demand rising this week.`
                    : `Decrease price by ${(Math.abs(priceChange) * 100).toFixed(1)}% — competitors are offering lower prices and demand is softening.`,
                expectedRevenueImpact: parseFloat((priceChange * 80 + Math.random() * 10).toFixed(1)),
                confidenceScore: parseFloat((0.6 + Math.random() * 0.35).toFixed(2)),
            });
        }
        console.log('Sample recommendations created');

        // Sample inventory forecasts
        for (const product of products.slice(0, 5)) {
            const demand = Math.round(product.stockLevel * (0.5 + Math.random() * 0.8));
            await InventoryForecast.create({
                productId: product._id,
                predictedDemand: demand,
                recommendedStockIncrease: Math.max(0, demand - product.stockLevel + product.reorderThreshold),
                currentStock: product.stockLevel,
                forecastRange: 30,
                reason: `Based on historical demand patterns and current trends, expected to sell ${demand} units in the next 30 days.`,
                confidenceScore: parseFloat((0.65 + Math.random() * 0.3).toFixed(2)),
            });
        }
        console.log('Sample forecasts created');

        // Sample alerts
        await Alert.insertMany([
            { productId: products[0]._id, type: 'competitor_undercut', severity: 'high', title: `Price Alert: ${products[0].name}`, message: `Amazon is selling at ₹${Math.round(products[0].currentPrice * 0.88)} (12% lower)` },
            { productId: products[2]._id, type: 'stockout_risk', severity: 'critical', title: `Stock Alert: ${products[2].name}`, message: `Only ${products[2].stockLevel} units left with high demand forecast` },
            { productId: products[4]._id, type: 'competitor_stockout', severity: 'medium', title: `Opportunity: ${products[4].name}`, message: `Flipkart is out of stock — raise price to capture demand` },
            { productId: products[1]._id, type: 'promotion', severity: 'low', title: `Promo Suggestion: ${products[1].name}`, message: `Consider 10% discount to clear excess inventory (500 units in stock)` },
        ]);
        console.log('Sample alerts created');

        console.log('\n✅ Database seeded successfully!');
        console.log('Admin login: admin@ecom.ai / admin123');
        console.log('User login: manager@ecom.ai / manager123');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
