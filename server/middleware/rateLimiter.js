const rateLimit = require('express-rate-limit');

// Limiter for general API routes (e.g. auth, products, stats)
exports.globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Generous limit for modern SPA multi-component browsing
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

// Stricter limiter for specific high-resource or sensitive endpoints
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600, // 600 requests per 15 minutes to accommodate rapid dashboard queries
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many requests, please try again after 15 minutes',
    },
});

// Stricter limiter for AI generation (costly LLM invocations)
exports.aiGenerationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 60, // Limit each IP to 60 generation requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many AI generation requests from this IP, please try again after an hour',
    },
});
