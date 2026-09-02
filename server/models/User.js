const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    storeType: { type: String, default: 'general' },
    storeName: { type: String, default: 'Primary Store' },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    activeProfileId: { type: String, default: 'default' },
    profiles: [{
        id: { type: String, default: 'default' },
        name: { type: String, default: 'Primary Store' },
        storeType: { type: String, default: 'general' },
        platform: { type: String, default: 'Shopify' },
        role: { type: String, default: 'Store Owner' },
        currency: { type: String, default: 'INR' },
        color: { type: String, default: '#6366f1' },
        isDefault: { type: Boolean, default: true },
        targetMargin: { type: Number, default: 20 },
    }],
    preferences: {
        theme: { type: String, default: 'dark' },
        currency: { type: String, default: 'INR' },
        minMarginFloor: { type: Number, default: 15 },
        maxSurgeCeiling: { type: Number, default: 35 },
        autoApplyRecommendations: { type: Boolean, default: false },
        recommendationThreshold: { type: Number, default: 90 },
        pricingStrategy: { type: String, default: 'undercut_1' },
        emailNotifications: { type: Boolean, default: true },
        priceDropAlerts: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
    },
    onboarding: {
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
        skipped: { type: Boolean, default: false },
        channels: [{ type: String }],
        goals: [{ type: String }],
        pricingStrategy: { type: String, default: 'undercut_1' },
        automationLevel: { type: String, default: 'semi_auto' },
        catalogSize: { type: String, default: '1_50' },
        industryNiche: { type: String, default: 'general' },
        targetMarginFloor: { type: Number, default: 20 },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
