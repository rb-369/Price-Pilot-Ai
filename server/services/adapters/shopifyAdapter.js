/**
 * Shopify Platform Adapter
 * 
 * Fetches orders from Shopify REST Admin API and pushes inventory updates.
 * In mock mode (SHOPIFY_MOCK=true or no credentials), returns realistic mock data.
 * 
 * Note on Custom App Scopes:
 * Make sure your Shopify Custom App has all four required API access scopes enabled:
 *   - read_orders     (for fetchNewOrders)
 *   - read_products   (to map variant_id -> inventory_item_id)
 *   - write_inventory (for inventory_levels/set)
 *   - read_locations  (to resolve store location ID)
 * 
 * Note on REST vs GraphQL:
 * REST Admin API is used here for simplicity in a custom app context.
 * Default read_orders scope covers orders from the last 60 days, which is well within
 * our 2-minute polling window.
 */

const axios = require('axios');
const logger = require('../../config/logger');

const MOCK_MODE = process.env.SHOPIFY_MOCK !== 'false';
const API_VERSION = '2026-04';

// ─── Mock Data ──────────────────────────────────────────────────────────────

function generateMockOrders(sinceDate) {
    const now = new Date();
    const since = sinceDate ? new Date(sinceDate) : new Date(now - 5 * 60 * 1000);
    const orderCount = Math.floor(Math.random() * 4); // 0-3 orders per poll

    const orders = [];
    for (let i = 0; i < orderCount; i++) {
        const qty = Math.floor(Math.random() * 3) + 1;
        const price = (Math.random() * 200 + 50).toFixed(2);
        const orderDate = new Date(since.getTime() + Math.random() * (now - since));

        orders.push({
            id: `shopify_${Date.now()}_${i}`,
            order_number: 1000 + Math.floor(Math.random() * 9000),
            created_at: orderDate.toISOString(),
            line_items: [{
                variant_id: `mock_variant_${Math.floor(Math.random() * 100)}`,
                sku: `SKU-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
                title: `Mock Shopify Product ${Math.floor(Math.random() * 20) + 1}`,
                quantity: qty,
                price: price,
            }],
            financial_status: 'paid',
            fulfillment_status: null,
        });
    }
    return orders;
}

// ─── Normalizer ─────────────────────────────────────────────────────────────

/**
 * Normalize a Shopify order into PricePilot's common order shape.
 * One Shopify order can have multiple line items → multiple normalized orders.
 */
function normalizeOrders(shopifyOrders) {
    const normalized = [];
    for (const order of shopifyOrders) {
        for (const item of order.line_items) {
            normalized.push({
                externalOrderId: String(order.id),
                orderId: `shopify_${order.id}_${item.variant_id}`,
                sku: item.sku || null,
                externalId: String(item.variant_id),
                productName: item.title,
                quantity: item.quantity,
                salePrice: parseFloat(item.price),
                purchasedAt: new Date(order.created_at),
                source: 'shopify_poll',
                platformData: {
                    orderNumber: order.order_number,
                    financialStatus: order.financial_status,
                    fulfillmentStatus: order.fulfillment_status,
                },
            });
        }
    }
    return normalized;
}

// ─── API Methods ────────────────────────────────────────────────────────────

/**
 * Fetch new orders from Shopify since a given date.
 * @param {Object} integration - Integration doc with shopUrl, accessToken
 * @param {Date|string} sinceDate - Only fetch orders created after this time
 * @returns {Object[]} Array of normalized orders
 */
async function fetchNewOrders(integration, sinceDate) {
    if (MOCK_MODE) {
        logger.info('[ShopifyAdapter] MOCK MODE — generating synthetic orders');
        const mockOrders = generateMockOrders(sinceDate);
        return normalizeOrders(mockOrders);
    }

    try {
        const since = sinceDate ? new Date(sinceDate).toISOString() : new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const url = `https://${integration.shopUrl}/admin/api/${API_VERSION}/orders.json`;

        const response = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': integration.accessToken },
            params: {
                created_at_min: since,
                status: 'any',
                limit: 250,
            },
        });

        return normalizeOrders(response.data.orders || []);
    } catch (error) {
        logger.error('[ShopifyAdapter] fetchNewOrders failed:', error.message);
        throw error;
    }
}

/**
 * Push updated stock level to Shopify for a specific product variant.
 * @param {Object} integration - Integration doc
 * @param {Object} product - Product doc with externalIds.shopifyId
 * @param {number} quantity - New available quantity (already has safety buffer subtracted)
 * @returns {boolean} success
 */
async function pushStockLevel(integration, product, quantity) {
    if (MOCK_MODE) {
        logger.info(`[ShopifyAdapter] MOCK MODE — would push stock ${quantity} for ${product.name}`);
        return true;
    }

    try {
        const variantId = product.externalIds?.shopifyId;
        if (!variantId) {
            logger.warn(`[ShopifyAdapter] No shopifyId for product ${product.sku}, skipping stock push`);
            return false;
        }

        // First, get the inventory_item_id from the variant
        const variantUrl = `https://${integration.shopUrl}/admin/api/${API_VERSION}/variants/${variantId}.json`;
        const variantRes = await axios.get(variantUrl, {
            headers: { 'X-Shopify-Access-Token': integration.accessToken },
        });

        const inventoryItemId = variantRes.data.variant?.inventory_item_id;
        if (!inventoryItemId) {
            logger.warn(`[ShopifyAdapter] No inventory_item_id for variant ${variantId}`);
            return false;
        }

        // Get locations
        const locationsUrl = `https://${integration.shopUrl}/admin/api/${API_VERSION}/locations.json`;
        const locationsRes = await axios.get(locationsUrl, {
            headers: { 'X-Shopify-Access-Token': integration.accessToken },
        });
        const locationId = locationsRes.data.locations?.[0]?.id;
        if (!locationId) {
            logger.warn('[ShopifyAdapter] No locations found');
            return false;
        }

        // Set inventory level
        const setUrl = `https://${integration.shopUrl}/admin/api/${API_VERSION}/inventory_levels/set.json`;
        await axios.post(setUrl, {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            available: Math.max(0, Math.floor(quantity)),
        }, {
            headers: { 'X-Shopify-Access-Token': integration.accessToken },
        });

        logger.info(`[ShopifyAdapter] Stock pushed: ${product.sku} → ${quantity}`);
        return true;
    } catch (error) {
        logger.error(`[ShopifyAdapter] pushStockLevel failed for ${product.sku}:`, error.message);
        return false;
    }
}

/**
 * Test the Shopify connection by fetching shop info.
 * @param {Object} integration
 * @returns {{ success: boolean, message: string }}
 */
async function testConnection(integration) {
    if (MOCK_MODE) {
        return { success: true, message: 'Mock Shopify connection is active' };
    }

    try {
        const url = `https://${integration.shopUrl}/admin/api/${API_VERSION}/shop.json`;
        const response = await axios.get(url, {
            headers: { 'X-Shopify-Access-Token': integration.accessToken },
        });
        return { success: true, message: `Connected to ${response.data.shop.name}` };
    } catch (error) {
        return { success: false, message: `Shopify connection failed: ${error.message}` };
    }
}

module.exports = { fetchNewOrders, pushStockLevel, testConnection };
