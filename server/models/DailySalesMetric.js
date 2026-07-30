const mongoose = require('mongoose');

const dailySalesMetricSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    date: {
        type: Date, // Normalized to start of day (00:00:00 UTC)
        required: true
    },
    totalUnitsSold: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    averageSalePrice: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure we only have one aggregated record per product per day per user
dailySalesMetricSchema.index({ userId: 1, productId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailySalesMetric', dailySalesMetricSchema);
