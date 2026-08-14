const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: 'Anonymous' },
    email: { type: String, default: '' },
    type: { 
        type: String, 
        enum: ['bug', 'data_error', 'ui_issue', 'performance', 'other'], 
        default: 'bug' 
    },
    severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'], 
        default: 'medium' 
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    pageUrl: { type: String, default: '' },
    systemInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { 
        type: String, 
        enum: ['open', 'in_progress', 'resolved', 'closed'], 
        default: 'open' 
    }
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ userId: 1 });

module.exports = mongoose.model('Report', reportSchema);
