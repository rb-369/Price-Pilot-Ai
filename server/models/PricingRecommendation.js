const mongoose = require('mongoose');

const pricingRecommendationSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    recommendedPrice: { type: Number, required: true },
    currentPrice: { type: Number },
    reason: { type: String, required: true },
    expectedRevenueImpact: { type: Number, default: 0 }, // percentage
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    appliedAt: { type: Date },
    revenueBeforeChange: { type: Number },
    revenueAfterChange: { type: Number },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

pricingRecommendationSchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('PricingRecommendation', pricingRecommendationSchema);
