const mongoose = require('mongoose');

const productMappingSchema = new mongoose.Schema({
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
    platform: {
        type: String,
        enum: ['shopify', 'amazon', 'flipkart'],
        required: true
    },
    externalSku: {
        type: String                               // The SKU used on the external platform
    },
    externalId: {
        type: String                               // ASIN, FSN, Shopify variant ID
    },
    externalName: {
        type: String                               // Product name on external platform (for display/debugging)
    },
    confidence: {
        type: Number,                              // 1.0 for manual, 0.0–0.99 for AI suggestions
        default: 1.0
    },
    status: {
        type: String,
        enum: ['confirmed', 'suggested', 'rejected'],
        default: 'confirmed'
    }
}, { timestamps: true });

// One mapping per product per platform per user
productMappingSchema.index({ userId: 1, productId: 1, platform: 1 }, { unique: true });
// Fast lookup by external ID
productMappingSchema.index({ userId: 1, platform: 1, externalId: 1 });
productMappingSchema.index({ userId: 1, platform: 1, externalSku: 1 });

module.exports = mongoose.model('ProductMapping', productMappingSchema);
