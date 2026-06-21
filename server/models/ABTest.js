const mongoose = require('mongoose');

const abTestSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    variantA: {
        price: { type: Number, required: true },
        label: { type: String, default: 'control' }
    },
    variantB: {
        price: { type: Number, required: true },
        label: { type: String, default: 'ai_recommended' }
    },
    
    status: {
        type: String,
        enum: ['active', 'completed', 'paused'],
        default: 'active'
    },
    
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    
    results: {
        variantA: {
            views: { type: Number, default: 0 },
            conversions: { type: Number, default: 0 },
            revenue: { type: Number, default: 0 }
        },
        variantB: {
            views: { type: Number, default: 0 },
            conversions: { type: Number, default: 0 },
            revenue: { type: Number, default: 0 }
        }
    },
    
    winner: { type: String, enum: ['A', 'B', 'tie', null], default: null },
    confidenceLevel: { type: Number, default: 0 } // Statistical significance %
}, { timestamps: true });

abTestSchema.index({ userId: 1, status: 1 });
abTestSchema.index({ productId: 1, status: 1 });

module.exports = mongoose.model('ABTest', abTestSchema);
