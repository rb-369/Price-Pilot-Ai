const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const salesSimulator = require('../controllers/salesSimulator');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Automated Ingestion (Webhook)
router.post('/webhook', protect, apiLimiter, salesController.handleWebhook);

// Manual Bulk Ingestion (CSV/Excel)
router.post('/upload', protect, apiLimiter, salesController.handleBulkUpload);

// AI Column Mapping Proxy
router.post('/map-columns', protect, apiLimiter, salesController.getAILocalColumnMapping);

// Analytics
router.get('/analytics', protect, apiLimiter, salesController.getAnalyticsSummary);
router.get('/product/:productId', protect, apiLimiter, salesController.getProductSalesMetrics);

// Simulator
router.post('/simulate', protect, apiLimiter, salesSimulator.triggerSimulation);

module.exports = router;
