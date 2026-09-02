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
const mongoose = require('mongoose');

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
const integrationRoutes = require('./routes/integrations');
const salesRoutes = require('./routes/salesRoutes');
const mappingRoutes = require('./routes/mappingRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const reportRoutes = require('./routes/reportRoutes');

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
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

// ── Compression (gzip) ──
app.use(compression({
    filter: (req, res) => {
        if (req.headers['accept'] === 'text/event-stream') {
            return false;
        }
        return compression.filter(req, res);
    }
}));

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
        // Always allow local development origins (localhost / 127.0.0.1)
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
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
app.use('/api/integrations', integrationRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/mappings', mappingRoutes);
app.use('/api/simulator', simulatorRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
    });
});

// ── Interactive Swagger / OpenAPI 3.0 Documentation ──
const swaggerDocument = require('./config/swaggerDoc');

app.get('/api/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
});

const renderSwaggerHTML = (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PricePilot AI — Interactive OpenAPI 3.0 Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://price-pilot-ai-369.vercel.app/favicon.ico" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .topbar { display: none !important; }
        .swagger-ui .info .title { color: #38bdf8 !important; }
        .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8 !important; }
        .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
        .swagger-ui .wrapper { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .banner { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-bottom: 1px solid #4338ca; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; }
        .banner-title { font-size: 20px; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 10px; }
        .badge { background: #4f46e5; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .btn-app { background: #06b6d4; color: #0f172a; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .btn-app:hover { background: #22d3ee; }
    </style>
</head>
<body>
    <div class="banner">
        <div class="banner-title">
            <span>🚀 PricePilot AI — Developer API Portal</span>
            <span class="badge">OpenAPI 3.0</span>
        </div>
        <a href="https://price-pilot-ai-369.vercel.app/dashboard" class="btn-app">Open Merchant App →</a>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/api/docs/swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout"
            });
            window.ui = ui;
        };
    </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
};

app.get('/api/docs', renderSwaggerHTML);
app.get('/docs', renderSwaggerHTML);


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
