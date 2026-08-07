const Integration = require('../models/Integration');
const Product = require('../models/Product');
const axios = require('axios');

exports.getIntegrations = async (req, res) => {
    try {
        const integrations = await Integration.find({ userId: req.user._id });
        res.json(integrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.connectShopify = async (req, res) => {
    try {
        const { shopUrl, accessToken } = req.body;
        if (!shopUrl || !accessToken) {
            return res.status(400).json({ message: 'Shop URL and Access Token are required.' });
        }

        // Verify the token by fetching shop info
        const cleanShopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        try {
            await axios.get(`https://${cleanShopUrl}/admin/api/2024-01/shop.json`, {
                headers: { 'X-Shopify-Access-Token': accessToken }
            });
        } catch (shopifyErr) {
            return res.status(401).json({ message: 'Invalid Shopify credentials. Failed to connect.' });
        }

        const integration = await Integration.findOneAndUpdate(
            { userId: req.user._id, platform: 'shopify' },
            { shopUrl: cleanShopUrl, accessToken, status: 'active' },
            { new: true, upsert: true }
        );

        res.json({ message: 'Shopify connected successfully!', integration });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.disconnectIntegration = async (req, res) => {
    try {
        const { id } = req.params;
        await Integration.findOneAndDelete({ _id: id, userId: req.user._id });
        res.json({ message: 'Integration disconnected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.syncShopifyProducts = async (req, res) => {
    try {
        const integration = await Integration.findOne({ userId: req.user._id, platform: 'shopify' });
        if (!integration || integration.status !== 'active') {
            return res.status(400).json({ message: 'Shopify integration not found or inactive.' });
        }

        // Fetch products from Shopify
        const shopifyRes = await axios.get(`https://${integration.shopUrl}/admin/api/2024-01/products.json`, {
            headers: { 'X-Shopify-Access-Token': integration.accessToken }
        });

        const shopifyProducts = shopifyRes.data.products;
        let importedCount = 0;

        for (const sp of shopifyProducts) {
            const variant = sp.variants[0]; // Assuming first variant for simplicity
            if (!variant) continue;

            const sku = variant.sku || `SHOPIFY-${sp.id}`;
            const price = parseFloat(variant.price) || 0;
            const cost = price * 0.7; // Dummy base cost estimation
            
            // Upsert product
            await Product.findOneAndUpdate(
                { userId: req.user._id, sku },
                {
                    name: sp.title,
                    category: sp.product_type || 'General',
                    description: sp.body_html ? sp.body_html.replace(/<[^>]+>/g, '') : '',
                    currentPrice: price,
                    baseCost: cost, // Don't override if exists ideally, but doing upsert
                    stockLevel: variant.inventory_quantity || 0,
                    source: 'shopify',
                    'externalIds.shopifyId': variant.id.toString(),
                    'productLinks.shopify': `https://${integration.shopUrl}/products/${sp.handle}`
                },
                { upsert: true, setDefaultsOnInsert: true }
            );
            importedCount++;
        }

        integration.lastSyncedAt = new Date();
        await integration.save();

        res.json({ message: `Successfully synced ${importedCount} products from Shopify.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to sync Shopify products', error: error.message });
    }
};

/**
 * POST /api/integrations/amazon/connect
 * Connect Amazon SP-API with LWA credentials.
 */
exports.connectAmazon = async (req, res) => {
    try {
        const { accessToken, refreshToken, sellerId, marketplaceId } = req.body;
        if (!accessToken || !sellerId) {
            return res.status(400).json({ message: 'Access Token and Seller ID are required.' });
        }

        const integration = await Integration.findOneAndUpdate(
            { userId: req.user._id, platform: 'amazon' },
            {
                accessToken,
                refreshToken: refreshToken || '',
                sellerId,
                marketplaceId: marketplaceId || 'A21TJRUUN4KGV', // India default
                status: 'active',
            },
            { new: true, upsert: true }
        );

        res.json({ message: 'Amazon SP-API connected successfully!', integration });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/integrations/flipkart/connect
 * Connect Flipkart Seller API with application credentials.
 */
exports.connectFlipkart = async (req, res) => {
    try {
        const { applicationId, applicationSecret } = req.body;
        if (!applicationId || !applicationSecret) {
            return res.status(400).json({ message: 'Application ID and Application Secret are required.' });
        }

        const integration = await Integration.findOneAndUpdate(
            { userId: req.user._id, platform: 'flipkart' },
            {
                sellerId: applicationId,
                accessToken: applicationSecret,
                status: 'active',
            },
            { new: true, upsert: true }
        );

        res.json({ message: 'Flipkart connected successfully!', integration });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/integrations/:id/test
 * Test connectivity to the platform.
 */
exports.testConnection = async (req, res) => {
    try {
        const integration = await Integration.findOne({ _id: req.params.id, userId: req.user._id });
        if (!integration) {
            return res.status(404).json({ message: 'Integration not found.' });
        }

        const { getAdapter } = require('../services/adapters/adapterFactory');
        const adapter = getAdapter(integration.platform);
        const result = await adapter.testConnection(integration);

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/integrations/:id/sync-now
 * Trigger an immediate order poll for this integration.
 */
exports.syncNow = async (req, res) => {
    try {
        const integration = await Integration.findOne({ _id: req.params.id, userId: req.user._id });
        if (!integration) {
            return res.status(404).json({ message: 'Integration not found.' });
        }

        if (integration.status !== 'active') {
            return res.status(400).json({ message: 'Integration is not active.' });
        }

        const { pollSingleIntegration } = require('../services/orderSyncService');
        const result = await pollSingleIntegration(integration);

        res.json({
            success: true,
            message: `Sync complete. New orders: ${result.newOrders}, Skipped: ${result.skipped}`,
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/integrations/:id/sync-logs
 * Get sync history for an integration.
 */
exports.getSyncLogs = async (req, res) => {
    try {
        const SyncLog = require('../models/SyncLog');
        const logs = await SyncLog.find({
            userId: req.user._id,
            $or: [
                { integrationId: req.params.id },
                { integrationId: { $exists: false } }, // Reconciliation logs
            ],
        })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('productId', 'name sku');

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/integrations/sync-logs/all
 * Get all sync logs for the authenticated user (for the activity feed).
 */
exports.getAllSyncLogs = async (req, res) => {
    try {
        const SyncLog = require('../models/SyncLog');
        const limit = parseInt(req.query.limit) || 50;
        const logs = await SyncLog.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('productId', 'name sku');

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

