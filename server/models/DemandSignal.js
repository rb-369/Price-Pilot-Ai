const mongoose = require('mongoose');

const demandSignalSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    searchTrendScore: { type: Number, default: 0, min: 0, max: 100 },
    weatherFactor: { type: Number, default: 0, min: -1, max: 1 },
    eventFactor: { type: Number, default: 0, min: -1, max: 1 },
    socialSentimentScore: { type: Number, default: 0, min: -1, max: 1 },
    compositeDemandScore: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

demandSignalSchema.pre('save', function (next) {
    // Weighted composite demand score
    this.compositeDemandScore =
        (this.searchTrendScore / 100) * 0.4 +
        ((this.weatherFactor + 1) / 2) * 0.2 +
        ((this.eventFactor + 1) / 2) * 0.2 +
        ((this.socialSentimentScore + 1) / 2) * 0.2;
    next();
});

demandSignalSchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('DemandSignal', demandSignalSchema);
