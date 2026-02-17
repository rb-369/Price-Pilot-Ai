const mongoose = require('mongoose');

const competitorPriceSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    competitorName: { type: String, required: true },
    competitorPrice: { type: Number, required: true },
    competitorUrl: { type: String, default: '' },
    inStock: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

competitorPriceSchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('CompetitorPrice', competitorPriceSchema);
