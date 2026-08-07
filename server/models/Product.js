const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true },
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
    externalIds: {
        shopifyId: { type: String, default: null },
        amazonAsin: { type: String, default: null },
        flipkartFsn: { type: String, default: null }
    },
    source: { type: String, enum: ['manual', 'shopify', 'amazon', 'flipkart'], default: 'manual' },
    safetyBuffer: { type: Number, default: 2 },           // Units held back from each platform to prevent overselling
    lastSyncedAt: { type: Date },                          // Last successful cross-platform stock sync
    syncEnabled: { type: Boolean, default: true },         // Master toggle for this product's multi-channel sync
    salesVelocity: {
        avgHourlySalesRate: { type: Number, default: 0 },  // Rolling average units sold per hour
        lastCalculatedAt: { type: Date },                  // When velocity was last recalculated
        peakHourlySalesRate: { type: Number, default: 0 }, // Max hourly rate seen (for spike detection)
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productSchema.index({ sku: 1, userId: 1 }, { unique: true });

productSchema.virtual('marginPercent').get(function () {
    if (this.currentPrice === 0) return 0;
    return ((this.currentPrice - this.baseCost) / this.currentPrice) * 100;
});

module.exports = mongoose.model('Product', productSchema);
