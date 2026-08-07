const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    integrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Integration'
    },
    action: {
        type: String,
        enum: ['order_ingested', 'stock_pushed', 'reconciliation', 'mapping_created', 'poll_completed', 'poll_failed'],
        required: true
    },
    platform: {
        type: String,
        enum: ['shopify', 'amazon', 'flipkart']
    },
    details: {
        type: Object,                              // { oldStock, newStock, orderId, orderCount, errors, etc. }
        default: {}
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'partial'],
        default: 'success'
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });

// Fast lookup for activity feed
syncLogSchema.index({ userId: 1, createdAt: -1 });
// Fast lookup per product
syncLogSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
