const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platform: {
        type: String,
        enum: ['shopify', 'amazon', 'flipkart'],
        required: true
    },
    shopUrl: {
        type: String,
        required: function() { return this.platform === 'shopify'; }
    },
    accessToken: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'error', 'disconnected'],
        default: 'active'
    },
    lastSyncedAt: {
        type: Date
    }
}, { timestamps: true });

// Prevent duplicate platform connections per user
integrationSchema.index({ userId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
