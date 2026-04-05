require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { initCronJobs } = require('./cron/scheduler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const competitorRoutes = require('./routes/competitorRoutes');
const demandRoutes = require('./routes/demandRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// ── Security & Middleware ──
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/competitor-prices', competitorRoutes);
app.use('/api/demand-signals', demandRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ── Serve React Client in Production ──
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

// ── 404 Handler for unknown API routes ──
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        initCronJobs();
        app.listen(PORT, () => {
            console.log(`🚀 PricePilot Server running on port ${PORT}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
