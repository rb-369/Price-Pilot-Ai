const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    orderId: {
        type: String, // External ID from Shopify/Amazon or generated for manual uploads
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    salePrice: {
        type: Number, // Price per unit at the time of sale
        required: true
    },
    totalAmount: {
        type: Number, // quantity * salePrice
        required: true
    },
    purchasedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    source: {
        type: String,
        enum: ['manual_csv', 'shopify_webhook', 'shopify_poll', 'amazon_poll', 'flipkart_poll', 'simulator', 'unknown'],
        default: 'unknown'
    },
    externalOrderId: {
        type: String                                   // Raw order ID from the platform (before normalization)
    },
    platformData: {
        type: Object                                   // Raw platform response snapshot for debugging
    }
}, { timestamps: true });

// Prevent duplicate webhooks from inserting the same order twice
orderSchema.index({ userId: 1, orderId: 1 }, { unique: true });
// Index for fast querying by product and date
orderSchema.index({ productId: 1, purchasedAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
