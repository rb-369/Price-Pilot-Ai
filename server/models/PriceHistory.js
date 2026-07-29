const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    price: { type: Number, required: true },
    baseCost: { type: Number, required: true },
    competitorAvgPrice: { type: Number, default: 0 },
    amazonPrice: { type: Number, default: 0 },
    flipkartPrice: { type: Number, default: 0 },
    changeReason: { type: String, default: 'price_update' }, // 'recommendation_accepted', 'manual_update', 'initial_price'
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

priceHistorySchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
