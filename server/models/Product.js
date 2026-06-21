const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, default: 'general' },
    baseCost: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    minMargin: { type: Number, default: 0.1 }, // 10% minimum margin
    stockLevel: { type: Number, default: 0 },
    reorderThreshold: { type: Number, default: 10 },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    productLinks: {
        amazon: { type: String, default: '' },
        flipkart: { type: String, default: '' },
        meesho: { type: String, default: '' },
        shopify: { type: String, default: '' },
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productSchema.virtual('marginPercent').get(function () {
    if (this.currentPrice === 0) return 0;
    return ((this.currentPrice - this.baseCost) / this.currentPrice) * 100;
});

module.exports = mongoose.model('Product', productSchema);
