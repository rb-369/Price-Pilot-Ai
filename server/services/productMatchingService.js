/**
 * Product Matching Service
 * 
 * Layered matching strategy to resolve an incoming order's product reference
 * to a local PricePilot Product document:
 * 
 * 1. EXACT SKU MATCH       → Product.sku === incoming SKU       → confidence: 1.0
 * 2. EXTERNAL ID MATCH     → externalIds.{platform} === id      → confidence: 1.0
 * 3. PRODUCT MAPPING TABLE → ProductMapping lookup               → confidence: 1.0 (manual) / varies (AI)
 * 4. FUZZY NAME MATCH      → Dice coefficient on product name   → confidence: 0.0–0.99
 *    └─ If confidence > 0.7 → auto-create mapping as 'suggested'
 *    └─ If confidence < 0.7 → log as 'unmatched', surface in UI
 */

const stringSimilarity = require('string-similarity');
const Product = require('../models/Product');
const ProductMapping = require('../models/ProductMapping');
const SyncLog = require('../models/SyncLog');
const logger = require('../config/logger');

/**
 * Attempt to match an incoming order item to a local Product.
 * 
 * @param {string} userId - The user's ObjectId
 * @param {Object} orderItem - Normalized order item from an adapter
 * @param {string} orderItem.sku - SKU from the platform
 * @param {string} orderItem.externalId - Platform-specific ID (ASIN, FSN, variant ID)
 * @param {string} orderItem.productName - Product name from the platform
 * @param {string} platform - 'shopify' | 'amazon' | 'flipkart'
 * @returns {{ product: Object|null, confidence: number, matchType: string }}
 */
async function matchProduct(userId, orderItem, platform) {
    const { sku, externalId, productName } = orderItem;

    // ── Layer 1: Exact SKU Match ────────────────────────────────────────
    if (sku) {
        const product = await Product.findOne({ userId, sku: { $regex: new RegExp(`^${escapeRegex(sku)}$`, 'i') } });
        if (product) {
            return { product, confidence: 1.0, matchType: 'sku_exact' };
        }
    }

    // ── Layer 2: External ID Match ──────────────────────────────────────
    if (externalId) {
        const externalIdField = getExternalIdField(platform);
        if (externalIdField) {
            const product = await Product.findOne({ userId, [externalIdField]: externalId });
            if (product) {
                return { product, confidence: 1.0, matchType: 'external_id' };
            }
        }
    }

    // ── Layer 3: Product Mapping Table ──────────────────────────────────
    let mapping = null;
    if (externalId) {
        mapping = await ProductMapping.findOne({
            userId,
            platform,
            externalId,
            status: 'confirmed',
        });
    }
    if (!mapping && sku) {
        mapping = await ProductMapping.findOne({
            userId,
            platform,
            externalSku: { $regex: new RegExp(`^${escapeRegex(sku)}$`, 'i') },
            status: 'confirmed',
        });
    }
    if (mapping) {
        const product = await Product.findById(mapping.productId);
        if (product) {
            return { product, confidence: mapping.confidence, matchType: 'mapping_table' };
        }
    }

    // ── Layer 4: Fuzzy Name Match ───────────────────────────────────────
    if (productName) {
        const allProducts = await Product.find({ userId }).select('name sku _id');
        if (allProducts.length > 0) {
            const productNames = allProducts.map(p => p.name);
            const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(productName, productNames);

            if (bestMatch.rating > 0.7) {
                const matchedProduct = allProducts[bestMatchIndex];

                // Auto-create a 'suggested' mapping for human review
                try {
                    await ProductMapping.findOneAndUpdate(
                        { userId, productId: matchedProduct._id, platform },
                        {
                            externalSku: sku || '',
                            externalId: externalId || '',
                            externalName: productName,
                            confidence: bestMatch.rating,
                            status: 'suggested',
                        },
                        { upsert: true, new: true }
                    );

                    await SyncLog.create({
                        userId,
                        productId: matchedProduct._id,
                        action: 'mapping_created',
                        platform,
                        details: {
                            matchType: 'fuzzy_auto',
                            externalName: productName,
                            localName: matchedProduct.name,
                            confidence: bestMatch.rating,
                        },
                        status: 'success',
                    });
                } catch (err) {
                    // Duplicate mapping — that's fine
                    if (err.code !== 11000) {
                        logger.error('[ProductMatchingService] Failed to create suggested mapping:', err.message);
                    }
                }

                return { product: matchedProduct, confidence: bestMatch.rating, matchType: 'fuzzy_name' };
            }
        }
    }

    // ── No Match Found ──────────────────────────────────────────────────
    logger.warn(`[ProductMatchingService] No match found for order item: sku=${sku}, externalId=${externalId}, name=${productName}`);
    return { product: null, confidence: 0, matchType: 'unmatched' };
}

/**
 * Run AI fuzzy matching across all unmatched products on a platform.
 * Returns suggested mappings for human review.
 */
async function autoMatchAll(userId, platform, externalProducts) {
    const localProducts = await Product.find({ userId }).select('name sku _id');
    if (localProducts.length === 0 || externalProducts.length === 0) return [];

    const localNames = localProducts.map(p => p.name);
    const suggestions = [];

    for (const ext of externalProducts) {
        // Skip if already mapped
        const existing = await ProductMapping.findOne({
            userId,
            platform,
            externalId: ext.externalId,
            status: { $in: ['confirmed', 'suggested'] },
        });
        if (existing) continue;

        const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(ext.name, localNames);

        if (bestMatch.rating > 0.4) {
            const localProduct = localProducts[bestMatchIndex];

            const mapping = await ProductMapping.findOneAndUpdate(
                { userId, productId: localProduct._id, platform },
                {
                    externalSku: ext.sku || '',
                    externalId: ext.externalId || '',
                    externalName: ext.name,
                    confidence: bestMatch.rating,
                    status: bestMatch.rating > 0.7 ? 'suggested' : 'suggested',
                },
                { upsert: true, new: true }
            );

            suggestions.push({
                mappingId: mapping._id,
                localProduct: { id: localProduct._id, name: localProduct.name, sku: localProduct.sku },
                externalProduct: ext,
                confidence: bestMatch.rating,
            });
        }
    }

    return suggestions;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getExternalIdField(platform) {
    const map = {
        shopify: 'externalIds.shopifyId',
        amazon: 'externalIds.amazonAsin',
        flipkart: 'externalIds.flipkartFsn',
    };
    return map[platform] || null;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { matchProduct, autoMatchAll };
