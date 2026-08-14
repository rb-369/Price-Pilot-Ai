const mongoose = require('mongoose');

const platformFeedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: 'Anonymous' },
    email: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    category: { 
        type: String, 
        enum: ['pricing_accuracy', 'ui_ux', 'feature_request', 'speed', 'general'], 
        default: 'general' 
    },
    comment: { type: String, required: true, trim: true },
    pageUrl: { type: String, default: '' },
    status: { 
        type: String, 
        enum: ['new', 'reviewed', 'archived'], 
        default: 'new' 
    }
}, { timestamps: true });

platformFeedbackSchema.index({ status: 1, createdAt: -1 });
platformFeedbackSchema.index({ userId: 1 });

module.exports = mongoose.model('PlatformFeedback', platformFeedbackSchema);
