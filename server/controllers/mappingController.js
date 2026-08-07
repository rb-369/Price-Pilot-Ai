/**
 * Mapping Controller
 * 
 * CRUD operations for cross-platform product mappings + AI auto-match.
 */

const ProductMapping = require('../models/ProductMapping');
const Product = require('../models/Product');
const SyncLog = require('../models/SyncLog');
const { autoMatchAll } = require('../services/productMatchingService');
const logger = require('../config/logger');

/**
 * GET /api/mappings
 * Get all product-platform mappings for the authenticated user.
 */
exports.getMappings = async (req, res) => {
    try {
        const mappings = await ProductMapping.find({ userId: req.user._id })
            .populate('productId', 'name sku category currentPrice stockLevel imageUrl')
            .sort({ updatedAt: -1 });

        res.json({ success: true, data: mappings });
    } catch (error) {
        logger.error('Error fetching mappings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/mappings
 * Create or update a manual product mapping.
 */
exports.createMapping = async (req, res) => {
    try {
        const { productId, platform, externalSku, externalId, externalName } = req.body;

        if (!productId || !platform) {
            return res.status(400).json({ success: false, message: 'productId and platform are required.' });
        }

        // Verify product belongs to user
        const product = await Product.findOne({ _id: productId, userId: req.user._id });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const mapping = await ProductMapping.findOneAndUpdate(
            { userId: req.user._id, productId, platform },
            {
                externalSku: externalSku || '',
                externalId: externalId || '',
                externalName: externalName || '',
                confidence: 1.0, // Manual = 100% confidence
                status: 'confirmed',
            },
            { upsert: true, new: true }
        );

        // Also update the product's externalIds for fast lookups
        const externalIdField = {
            shopify: 'externalIds.shopifyId',
            amazon: 'externalIds.amazonAsin',
            flipkart: 'externalIds.flipkartFsn',
        }[platform];

        if (externalIdField && externalId) {
            await Product.findByIdAndUpdate(productId, { [externalIdField]: externalId });
        }

        await SyncLog.create({
            userId: req.user._id,
            productId,
            action: 'mapping_created',
            platform,
            details: { externalSku, externalId, externalName, manual: true },
            status: 'success',
        });

        res.json({ success: true, data: mapping });
    } catch (error) {
        logger.error('Error creating mapping:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/mappings/:id
 * Remove a product mapping.
 */
exports.deleteMapping = async (req, res) => {
    try {
        const mapping = await ProductMapping.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!mapping) {
            return res.status(404).json({ success: false, message: 'Mapping not found.' });
        }

        res.json({ success: true, message: 'Mapping removed.' });
    } catch (error) {
        logger.error('Error deleting mapping:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/mappings/auto-match
 * Run AI fuzzy matching across unmatched products.
 */
exports.autoMatch = async (req, res) => {
    try {
        const { platform, externalProducts } = req.body;

        if (!platform || !externalProducts || !Array.isArray(externalProducts)) {
            return res.status(400).json({
                success: false,
                message: 'platform and externalProducts[] are required.',
            });
        }

        const suggestions = await autoMatchAll(req.user._id, platform, externalProducts);

        res.json({
            success: true,
            data: suggestions,
            message: `Found ${suggestions.length} potential matches.`,
        });
    } catch (error) {
        logger.error('Error running auto-match:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/mappings/:id/confirm
 * Confirm an AI-suggested mapping.
 */
exports.confirmMapping = async (req, res) => {
    try {
        const mapping = await ProductMapping.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { status: 'confirmed', confidence: 1.0 },
            { new: true }
        );

        if (!mapping) {
            return res.status(404).json({ success: false, message: 'Mapping not found.' });
        }

        // Also update the product's externalIds
        const externalIdField = {
            shopify: 'externalIds.shopifyId',
            amazon: 'externalIds.amazonAsin',
            flipkart: 'externalIds.flipkartFsn',
        }[mapping.platform];

        if (externalIdField && mapping.externalId) {
            await Product.findByIdAndUpdate(mapping.productId, { [externalIdField]: mapping.externalId });
        }

        res.json({ success: true, data: mapping });
    } catch (error) {
        logger.error('Error confirming mapping:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/mappings/:id/reject
 * Reject an AI-suggested mapping.
 */
exports.rejectMapping = async (req, res) => {
    try {
        const mapping = await ProductMapping.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { status: 'rejected' },
            { new: true }
        );

        if (!mapping) {
            return res.status(404).json({ success: false, message: 'Mapping not found.' });
        }

        res.json({ success: true, data: mapping });
    } catch (error) {
        logger.error('Error rejecting mapping:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
