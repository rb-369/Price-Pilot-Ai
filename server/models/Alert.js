const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String,
        enum: ['price_drop', 'stockout_risk', 'competitor_undercut', 'competitor_stockout', 'promotion', 'reorder'],
        required: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    actionTaken: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

alertSchema.index({ userId: 1, read: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);
