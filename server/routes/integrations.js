const express = require('express');
const router = express.Router();
const {
    getIntegrations, connectShopify, disconnectIntegration, syncShopifyProducts,
    connectAmazon, connectFlipkart, testConnection, syncNow, getSyncLogs, getAllSyncLogs,
} = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Core CRUD
router.get('/', getIntegrations);
router.delete('/:id', disconnectIntegration);

// Shopify
router.post('/shopify', connectShopify);
router.post('/shopify/sync', syncShopifyProducts);

// Amazon
router.post('/amazon/connect', connectAmazon);

// Flipkart
router.post('/flipkart/connect', connectFlipkart);

// Sync logs (must be before /:id routes to avoid conflict)
router.get('/sync-logs/all', getAllSyncLogs);

// Per-integration actions
router.post('/:id/test', testConnection);
router.post('/:id/sync-now', syncNow);
router.get('/:id/sync-logs', getSyncLogs);

module.exports = router;
