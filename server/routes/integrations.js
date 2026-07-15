const express = require('express');
const router = express.Router();
const { getIntegrations, connectShopify, disconnectIntegration, syncShopifyProducts } = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getIntegrations);
router.post('/shopify', connectShopify);
router.delete('/:id', disconnectIntegration);
router.post('/shopify/sync', syncShopifyProducts);

module.exports = router;
