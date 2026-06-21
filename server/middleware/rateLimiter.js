const rateLimit = require('express-rate-limit');

// General API rate limiter: 1000 requests per 15 minutes (to allow polling)
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

// Strict rate limiter for AI generation endpoints: 10 requests per 15 minutes
exports.aiGenerationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'AI generation limit reached. Please try again later.' }
});
