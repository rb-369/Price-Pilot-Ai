const mongoose = require('mongoose');

const inventoryForecastSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    predictedDemand: { type: Number, required: true },
    recommendedStockIncrease: { type: Number, default: 0 },
    currentStock: { type: Number },
    forecastRange: { type: Number, default: 30 }, // days
    reason: { type: String, default: '' },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

inventoryForecastSchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('InventoryForecast', inventoryForecastSchema);
