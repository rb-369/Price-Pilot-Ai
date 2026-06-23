const express = require('express');
const router = express.Router();
const { getIntegrations, connectShopify, disconnectIntegration, syncShopifyProducts } = require('../controllers/integrationController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getIntegrations);
router.post('/shopify', connectShopify);
router.delete('/:id', disconnectIntegration);
router.post('/shopify/sync', syncShopifyProducts);

module.exports = router;
