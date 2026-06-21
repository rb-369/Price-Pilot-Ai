const mongoose = require('mongoose');

const feedbackLogSchema = new mongoose.Schema({
    recommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingRecommendation', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    priceBeforeChange: { type: Number, required: true },
    priceAfterChange: { type: Number, required: true },
    action: { type: String, enum: ['accepted', 'rejected'], required: true },
    
    // Captured at time of recommendation
    features: { type: mongoose.Schema.Types.Mixed, required: true },
    
    // Captured before price change
    stockBefore: { type: Number },
    demandScoreBefore: { type: Number },
    
    // Captured 7 days later
    stockAfter: { type: Number },
    demandScoreAfter: { type: Number },
    
    // Calculated post-hoc (actual vs predicted)
    revenueImpactActual: { type: Number },
    elasticityObserved: { type: Number },
    
    processedForRetraining: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

// We need to query logs that haven't been processed yet and are 7+ days old
feedbackLogSchema.index({ processedForRetraining: 1, timestamp: 1 });

module.exports = mongoose.model('FeedbackLog', feedbackLogSchema);
