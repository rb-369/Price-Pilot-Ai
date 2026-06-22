const rateLimit = require('express-rate-limit');

// Limiter for general API routes (e.g. auth, products)
exports.globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

// Stricter limiter for specific high-resource or sensitive endpoints
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many requests, please try again after 15 minutes',
    },
});

// Extremely strict limiter for AI generation (costly)
exports.aiGenerationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 generation requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many AI generation requests from this IP, please try again after an hour',
    },
});
