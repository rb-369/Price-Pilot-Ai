/**
 * Amazon SP-API Platform Adapter
 * 
 * Fetches orders from Amazon Selling Partner API and pushes inventory feeds.
 * In mock mode (default), returns realistic mock data matching SP-API schemas.
 * 
 * Region Guidance:
 * - India marketplace (A21TJRUUN4KGV) belongs to Far East (FE) region:
 *   Production Base URL: https://sellingpartnerapi-fe.amazon.com
 *   Sandbox Base URL:    https://sandbox.sellingpartnerapi-fe.amazon.com
 * - NA region (US - ATVPDKIKX0DER):
 *   Production Base URL: https://sellingpartnerapi-na.amazon.com
 *   Sandbox Base URL:    https://sandbox.sellingpartnerapi-na.amazon.com
 * 
 * Production mode requires:
 *   - LWA (Login with Amazon) client credentials (AMAZON_LWA_CLIENT_ID & AMAZON_LWA_CLIENT_SECRET)
 *   - SP-API app registration & seller authorization
 */

const axios = require('axios');
const logger = require('../../config/logger');

const MOCK_MODE = process.env.AMAZON_MOCK !== 'false';
const BASE_URL = process.env.AMAZON_SPAPI_BASE_URL || 'https://sellingpartnerapi-fe.amazon.com';

// ─── In-Memory LWA Token Cache ──────────────────────────────────────────────
// Caches access tokens per integration to avoid hitting api.amazon.com on every call
const tokenCache = new Map();

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PRODUCT_CATALOG = [
    { asin: 'B08MOCK001', sku: 'SKU-001', title: 'Wireless Bluetooth Earbuds Pro' },
    { asin: 'B08MOCK002', sku: 'SKU-002', title: 'USB-C Fast Charging Cable 2-Pack' },
    { asin: 'B08MOCK003', sku: 'SKU-003', title: 'Stainless Steel Water Bottle 1L' },
    { asin: 'B08MOCK004', sku: 'SKU-004', title: 'LED Desk Lamp with USB Port' },
    { asin: 'B08MOCK005', sku: 'SKU-005', title: 'Portable Phone Stand Adjustable' },
    { asin: 'B08MOCK006', sku: 'SKU-006', title: 'Cotton Face Mask Pack of 5' },
    { asin: 'B08MOCK007', sku: 'SKU-007', title: 'Silicone Kitchen Utensil Set' },
    { asin: 'B08MOCK008', sku: 'SKU-008', title: 'Bamboo Cutting Board Large' },
];

function generateMockOrders(sinceDate) {
    const now = new Date();
    const since = sinceDate ? new Date(sinceDate) : new Date(now - 5 * 60 * 1000);
    const orderCount = Math.floor(Math.random() * 3); // 0-2 orders per poll

    const orders = [];
    for (let i = 0; i < orderCount; i++) {
        const product = MOCK_PRODUCT_CATALOG[Math.floor(Math.random() * MOCK_PRODUCT_CATALOG.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = (Math.random() * 300 + 100).toFixed(2);
        const orderDate = new Date(since.getTime() + Math.random() * (now - since));

        orders.push({
            AmazonOrderId: `${100 + Math.floor(Math.random() * 900)}-${1000000 + Math.floor(Math.random() * 9000000)}-${1000000 + Math.floor(Math.random() * 9000000)}`,
            PurchaseDate: orderDate.toISOString(),
            OrderStatus: 'Unshipped',
            OrderTotal: { Amount: (qty * parseFloat(price)).toFixed(2), CurrencyCode: 'INR' },
            OrderItems: [{
                ASIN: product.asin,
                SellerSKU: product.sku,
                Title: product.title,
                QuantityOrdered: qty,
                ItemPrice: { Amount: price, CurrencyCode: 'INR' },
            }],
        });
    }
    return orders;
}

// ─── Normalizer ─────────────────────────────────────────────────────────────

function normalizeOrders(amazonOrders) {
    const normalized = [];
    for (const order of amazonOrders) {
        const items = order.OrderItems || [];
        for (const item of items) {
            normalized.push({
                externalOrderId: order.AmazonOrderId,
                orderId: `amazon_${order.AmazonOrderId}_${item.ASIN}`,
                sku: item.SellerSKU || null,
                externalId: item.ASIN,
                productName: item.Title,
                quantity: item.QuantityOrdered,
                salePrice: parseFloat(item.ItemPrice?.Amount || 0),
                purchasedAt: new Date(order.PurchaseDate),
                source: 'amazon_poll',
                platformData: {
                    amazonOrderId: order.AmazonOrderId,
                    orderStatus: order.OrderStatus,
                    orderTotal: order.OrderTotal,
                },
            });
        }
    }
    return normalized;
}

// ─── LWA Token Management ──────────────────────────────────────────────────

/**
 * Refresh the LWA access token using form-encoded HTTP body.
 * Correct header: application/x-www-form-urlencoded
 */
async function refreshAccessToken(integration) {
    try {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: integration.refreshToken || integration.accessToken,
            client_id: process.env.AMAZON_LWA_CLIENT_ID || '',
            client_secret: process.env.AMAZON_LWA_CLIENT_SECRET || '',
        });

        const response = await axios.post(
            'https://api.amazon.com/auth/o2/token',
            params.toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        return {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in || 3600,
        };
    } catch (error) {
        logger.error('[AmazonAdapter] LWA Token refresh failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get a valid LWA access token (uses in-memory caching with a 60-second buffer before expiry).
 */
async function getValidLwaToken(integration) {
    const key = String(integration._id || integration.sellerId);
    const cached = tokenCache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now + 60000) {
        return cached.accessToken;
    }

    const tokenData = await refreshAccessToken(integration);
    const expiresAt = now + tokenData.expiresIn * 1000;

    tokenCache.set(key, {
        accessToken: tokenData.accessToken,
        expiresAt,
    });

    return tokenData.accessToken;
}

// ─── API Methods ────────────────────────────────────────────────────────────

async function fetchNewOrders(integration, sinceDate) {
    if (MOCK_MODE) {
        logger.info('[AmazonAdapter] MOCK MODE — generating synthetic orders');
        const mockOrders = generateMockOrders(sinceDate);
        return normalizeOrders(mockOrders);
    }

    try {
        const accessToken = await getValidLwaToken(integration);
        const since = sinceDate ? new Date(sinceDate).toISOString() : new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const ordersRes = await axios.get(`${BASE_URL}/orders/v0/orders`, {
            headers: {
                'x-amz-access-token': accessToken,
                'Content-Type': 'application/json',
            },
            params: {
                MarketplaceIds: integration.marketplaceId || 'A21TJRUUN4KGV', // India
                CreatedAfter: since,
                OrderStatuses: 'Unshipped,PartiallyShipped,Shipped',
            },
        });

        const orders = ordersRes.data?.payload?.Orders || [];

        // Fetch order items for each order
        for (const order of orders) {
            try {
                const itemsRes = await axios.get(
                    `${BASE_URL}/orders/v0/orders/${order.AmazonOrderId}/orderItems`,
                    {
                        headers: { 'x-amz-access-token': accessToken },
                    }
                );
                order.OrderItems = itemsRes.data?.payload?.OrderItems || [];
            } catch (itemErr) {
                logger.error(`[AmazonAdapter] Failed to fetch items for order ${order.AmazonOrderId}:`, itemErr.message);
                order.OrderItems = [];
            }
        }

        return normalizeOrders(orders);
    } catch (error) {
        logger.error('[AmazonAdapter] fetchNewOrders failed:', error.message);
        throw error;
    }
}

/**
 * Push stock level to Amazon using the 3-step SP-API Feeds workflow:
 * Step 1: Create Feed Document (POST /feeds/2021-06-30/documents)
 * Step 2: Upload TSV inventory feed content to pre-signed S3 URL (PUT url)
 * Step 3: Submit Feed (POST /feeds/2021-06-30/feeds with inputFeedDocumentId)
 */
async function pushStockLevel(integration, product, quantity) {
    if (MOCK_MODE) {
        logger.info(`[AmazonAdapter] MOCK MODE — would push stock ${quantity} for ${product.name} (ASIN: ${product.externalIds?.amazonAsin})`);
        return true;
    }

    try {
        const sku = product.sku;
        if (!sku) {
            logger.warn(`[AmazonAdapter] No SKU for product ${product.name}, skipping stock push`);
            return false;
        }

        const accessToken = await getValidLwaToken(integration);

        // Step 1: Create Feed Document
        const createDocRes = await axios.post(
            `${BASE_URL}/feeds/2021-06-30/documents`,
            { contentType: 'text/tab-separated-values; charset=UTF-8' },
            { headers: { 'x-amz-access-token': accessToken } }
        );

        const { feedDocumentId, url } = createDocRes.data;
        if (!feedDocumentId || !url) {
            throw new Error('SP-API feed document creation failed to return URL/documentId');
        }

        // Step 2: Upload feed content (TSV format) to pre-signed S3 URL
        const feedContent = `sku\tquantity\n${sku}\t${Math.max(0, Math.floor(quantity))}`;
        await axios.put(url, feedContent, {
            headers: { 'Content-Type': 'text/tab-separated-values; charset=UTF-8' },
        });

        // Step 3: Create Feed referencing the inputFeedDocumentId
        const feedRes = await axios.post(
            `${BASE_URL}/feeds/2021-06-30/feeds`,
            {
                feedType: 'POST_INVENTORY_AVAILABILITY_DATA',
                marketplaceIds: [integration.marketplaceId || 'A21TJRUUN4KGV'],
                inputFeedDocumentId: feedDocumentId,
            },
            { headers: { 'x-amz-access-token': accessToken } }
        );

        logger.info(`[AmazonAdapter] Stock push 3-step feed submitted for ${sku}: feed ${feedRes.data?.feedId}`);
        return true;
    } catch (error) {
        logger.error(`[AmazonAdapter] pushStockLevel failed for ${product.sku}:`, error.response?.data || error.message);
        return false;
    }
}

async function testConnection(integration) {
    if (MOCK_MODE) {
        return { success: true, message: 'Mock Amazon SP-API connection is active' };
    }

    try {
        const accessToken = await getValidLwaToken(integration);

        // Test by fetching seller participations
        await axios.get(`${BASE_URL}/sellers/v1/marketplaceParticipations`, {
            headers: { 'x-amz-access-token': accessToken },
        });

        return { success: true, message: `Connected to Amazon Seller (${integration.sellerId})` };
    } catch (error) {
        return { success: false, message: `Amazon connection failed: ${error.response?.data?.message || error.message}` };
    }
}

module.exports = { fetchNewOrders, pushStockLevel, testConnection };
