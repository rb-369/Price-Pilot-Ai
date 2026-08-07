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
    },
    lastOrderPollAt: {
        type: Date                                     // Cursor for polling "orders created since X"
    },
    refreshToken: {
        type: String                                   // OAuth refresh token (Amazon LWA)
    },
    tokenExpiresAt: {
        type: Date                                     // When the current access token expires
    },
    sellerId: {
        type: String                                   // Amazon Seller ID / Flipkart seller ID
    },
    marketplaceId: {
        type: String                                   // Amazon marketplace (e.g., A21TJRUUN4KGV for India)
    },
    syncConfig: {
        pollIntervalMinutes: { type: Number, default: 2 },
        safetyBuffer: { type: Number, default: 2 },
    }
}, { timestamps: true });

// Prevent duplicate platform connections per user
integrationSchema.index({ userId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
