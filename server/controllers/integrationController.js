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
