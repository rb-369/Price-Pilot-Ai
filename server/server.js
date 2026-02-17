require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/competitor-prices', competitorRoutes);
app.use('/api/demand-signals', demandRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    initCronJobs();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer();
