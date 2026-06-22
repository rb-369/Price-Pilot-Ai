require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { initCronJobs } = require('./cron/scheduler');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const logger = require('./config/logger');
const { globalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const competitorRoutes = require('./routes/competitorRoutes');
const demandRoutes = require('./routes/demandRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const streamRoutes = require('./routes/stream');
const abTestRoutes = require('./routes/abTestRoutes');

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// ── Trust proxy (Render, Vercel, Heroku, etc. all sit behind a load balancer).
//    Required for correct client IPs in rate limiting and logs.
app.set('trust proxy', 1);

// ── Security headers ──
app.use(helmet({
    contentSecurityPolicy: false, // SSE responses are blocked by strict CSP; allow it for now
    crossOriginEmbedderPolicy: false,
}));

// ── Compression (gzip) ──
app.use(compression());

// ── CORS ──
// Build an explicit allowlist from env (comma-separated). When unset in dev, allow all.
const parseOrigins = (raw) => {
    if (!raw) return null;
    return raw.split(',').map(s => s.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins(process.env.CLIENT_URL);
const allowedRegex = process.env.CLIENT_URL_REGEX
    ? new RegExp(process.env.CLIENT_URL_REGEX)
    : null;

const corsOptions = {
    origin(origin, callback) {
        // Same-origin / curl / no Origin header — allow.
        if (!origin) return callback(null, true);
        if (allowedOrigins && allowedOrigins.includes(origin)) return callback(null, true);
        if (allowedRegex && allowedRegex.test(origin)) return callback(null, true);
        if (!IS_PROD) return callback(null, true); // dev: permissive
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};
app.use(cors(corsOptions));

// ── Request parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Data Sanitization ──
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// ── Logging ──
if (IS_PROD) {
    app.use(morgan('combined', { stream: logger.stream }));
} else {
    app.use(morgan('dev', { stream: logger.stream }));
}

// ── Apply Global Rate Limiter to API routes ──
app.use('/api', globalLimiter);

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/competitor-prices', competitorRoutes);
app.use('/api/demand-signals', demandRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/ab-tests', abTestRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
    });
});

// ── Liveness vs readiness (K8s/Render health checks) ──
app.get('/api/ready', (req, res) => {
    const states = mongoose.connection.readyState; // 1 = connected
    if (states !== 1) {
        return res.status(503).json({ status: 'not ready', mongo: states });
    }
    res.json({ status: 'ready', mongo: 'connected' });
});

// ── Root route ──
app.get('/', (req, res) => {
    res.json({
        name: 'PricePilot AI API',
        version: '1.0.0',
        status: 'live',
        docs: '/api/health',
    });
});

// ── 404 for unknown /api/* routes ──
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

// ── Serve React Client in Production ──
if (IS_PROD) {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuildPath, {
        maxAge: '1y',
        immutable: true,
        index: false, // let the catch-all below serve index.html for SPA routes
    }));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    logger.error(`[ERROR] ${err.message}`, { stack: err.stack });
    res.status(err.status || 500).json({
        message: IS_PROD ? 'Internal server error' : err.message,
        ...((!IS_PROD && process.env.DEBUG) && { stack: err.stack }),
    });
});

const PORT = process.env.PORT || 5000;

// ── Mongo connection state for health checks ──
const mongoose = require('mongoose');

const startServer = async () => {
    // Validate required env vars up front (fail fast, not at first request)
    const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
        logger.error(`❌ Missing required env vars: ${missing.join(', ')}`);
        process.exit(1);
    }

    try {
        await connectDB();
    } catch (err) {
        logger.error(`❌ MongoDB connection failed: ${err.message}`);
        process.exit(1);
    }

    // Cron jobs are off by default in production. Set ENABLE_CRON=1 to turn them on
    // (only do this on a single instance — they will double-run otherwise).
    if (process.env.ENABLE_CRON === '1' || !IS_PROD) {
        try {
            initCronJobs();
        } catch (err) {
            logger.error(`⚠️  Cron init failed (continuing without it): ${err.message}`);
        }
    } else {
        logger.info('ℹ️  Cron jobs disabled (set ENABLE_CRON=1 to enable).');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 PricePilot Server running on port ${PORT}`);
        logger.info(`   Environment: ${NODE_ENV}`);
    });

    // ── Graceful shutdown (Render sends SIGTERM on deploy) ──
    const shutdown = (signal) => {
        logger.info(`\n${signal} received. Starting graceful shutdown...`);
        server.close(() => {
            logger.info('✅ HTTP server closed.');
            mongoose.connection.close(false, () => {
                logger.info('✅ MongoDB connection closed.');
                process.exit(0);
            });
        });
        // Hard kill after 10s if shutdown stalls
        setTimeout(() => {
            logger.error('⚠️  Forced shutdown after 10s timeout.');
            process.exit(1);
        }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger.error(`Unhandled Rejection: ${reason}`);
    });
    process.on('uncaughtException', (err) => {
        logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
        shutdown('uncaughtException');
    });
};

startServer();
