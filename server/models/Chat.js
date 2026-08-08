const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    rating: {
        type: String,
        enum: ['like', 'dislike', null],
        default: null,
    },
    comment: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['accepted', 'ignored_offtopic', 'pending'],
        default: 'pending',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
}, { _id: false });

const messageSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
    },
    role: {
        type: String,
        enum: ['user', 'model', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    feedback: {
        type: feedbackSchema,
        default: null,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
}, { _id: true });

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        default: 'New Chat',
    },
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

chatSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Chat', chatSchema);
