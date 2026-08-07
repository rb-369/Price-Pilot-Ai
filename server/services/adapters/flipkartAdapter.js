/**
 * Flipkart Seller API Platform Adapter
 * 
 * Fetches orders from Flipkart Seller API v2/v3 and pushes inventory updates.
 * In mock mode (default), returns realistic mock data matching Flipkart's response shapes.
 * 
 * Production mode requires:
 *   - Flipkart Seller Application ID + Application Secret
 *   - Active seller account on seller.flipkart.com
 */

const axios = require('axios');
const logger = require('../../config/logger');

const MOCK_MODE = process.env.FLIPKART_MOCK !== 'false';
const FK_BASE_URL = 'https://seller.flipkart.com/napi';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_FK_CATALOG = [
    { fsn: 'FSNMOCK001', sku: 'SKU-001', title: 'Wireless Earbuds with Mic' },
    { fsn: 'FSNMOCK002', sku: 'SKU-002', title: 'USB-C Cable 1.5m Braided' },
    { fsn: 'FSNMOCK003', sku: 'SKU-003', title: 'Insulated Water Bottle 750ml' },
    { fsn: 'FSNMOCK004', sku: 'SKU-004', title: 'LED Table Lamp Rechargeable' },
    { fsn: 'FSNMOCK005', sku: 'SKU-005', title: 'Mobile Phone Holder Flexible' },
    { fsn: 'FSNMOCK006', sku: 'SKU-006', title: 'Kitchen Knife Set 3-Piece' },
];

function generateMockOrders(sinceDate) {
    const now = new Date();
    const since = sinceDate ? new Date(sinceDate) : new Date(now - 5 * 60 * 1000);
    const orderCount = Math.floor(Math.random() * 3);

    const orders = [];
    for (let i = 0; i < orderCount; i++) {
        const product = MOCK_FK_CATALOG[Math.floor(Math.random() * MOCK_FK_CATALOG.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = (Math.random() * 250 + 75).toFixed(2);
        const orderDate = new Date(since.getTime() + Math.random() * (now - since));

        orders.push({
            orderItemId: `OI${Date.now()}${i}${Math.floor(Math.random() * 10000)}`,
            orderId: `OD${Date.now()}${i}`,
            fsn: product.fsn,
            sku: product.sku,
            title: product.title,
            quantity: qty,
            priceComponents: { sellingPrice: parseFloat(price) },
            status: 'APPROVED',
            createdAt: orderDate.toISOString(),
        });
    }
    return orders;
}

// ─── Normalizer ─────────────────────────────────────────────────────────────

function normalizeOrders(flipkartOrders) {
    return flipkartOrders.map(item => ({
        externalOrderId: item.orderId,
        orderId: `flipkart_${item.orderId}_${item.orderItemId}`,
        sku: item.sku || null,
        externalId: item.fsn,
        productName: item.title,
        quantity: item.quantity,
        salePrice: item.priceComponents?.sellingPrice || 0,
        purchasedAt: new Date(item.createdAt),
        source: 'flipkart_poll',
        platformData: {
            orderItemId: item.orderItemId,
            orderId: item.orderId,
            fsn: item.fsn,
            status: item.status,
        },
    }));
}

// ─── Token Management ───────────────────────────────────────────────────────

/**
 * Get a fresh access token using application credentials.
 * Flipkart tokens typically expire after ~60 days.
 */
async function getAccessToken(integration) {
    try {
        const response = await axios.get(`${FK_BASE_URL}/auth/token`, {
            auth: {
                username: integration.sellerId,           // Application ID
                password: integration.accessToken,        // Application Secret
            },
        });
        return response.data?.access_token;
    } catch (error) {
        logger.error('[FlipkartAdapter] Token fetch failed:', error.message);
        throw error;
    }
}

// ─── API Methods ────────────────────────────────────────────────────────────

async function fetchNewOrders(integration, sinceDate) {
    if (MOCK_MODE) {
        logger.info('[FlipkartAdapter] MOCK MODE — generating synthetic orders');
        const mockOrders = generateMockOrders(sinceDate);
        return normalizeOrders(mockOrders);
    }

    try {
        const token = await getAccessToken(integration);

        // Flipkart uses shipment-based order fetching
        // We use the v2 orders endpoint for simplicity
        const response = await axios.get(`${FK_BASE_URL}/sellers/v2/orders/search`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: {
                status: 'APPROVED',
                createdAfter: sinceDate ? new Date(sinceDate).toISOString() : undefined,
            },
        });

        const orderItems = response.data?.orderItems || [];
        return normalizeOrders(orderItems);
    } catch (error) {
        logger.error('[FlipkartAdapter] fetchNewOrders failed:', error.message);
        throw error;
    }
}

async function pushStockLevel(integration, product, quantity) {
    if (MOCK_MODE) {
        logger.info(`[FlipkartAdapter] MOCK MODE — would push stock ${quantity} for ${product.name} (FSN: ${product.externalIds?.flipkartFsn})`);
        return true;
    }

    try {
        const sku = product.sku;
        if (!sku) {
            logger.warn(`[FlipkartAdapter] No SKU for product ${product.name}, skipping stock push`);
            return false;
        }

        const token = await getAccessToken(integration);

        // Flipkart inventory update: max 10 SKUs per request
        await axios.post(`${FK_BASE_URL}/listings/v3/update/inventory`, {
            [sku]: {
                inventory: [{ quantity: Math.max(0, Math.floor(quantity)) }],
            },
        }, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        logger.info(`[FlipkartAdapter] Stock pushed: ${sku} → ${quantity}`);
        return true;
    } catch (error) {
        logger.error(`[FlipkartAdapter] pushStockLevel failed for ${product.sku}:`, error.message);
        return false;
    }
}

async function testConnection(integration) {
    if (MOCK_MODE) {
        return { success: true, message: 'Mock Flipkart connection is active' };
    }

    try {
        const token = await getAccessToken(integration);
        if (token) {
            return { success: true, message: `Connected to Flipkart Seller (${integration.sellerId})` };
        }
        return { success: false, message: 'Failed to obtain Flipkart access token' };
    } catch (error) {
        return { success: false, message: `Flipkart connection failed: ${error.message}` };
    }
}

module.exports = { fetchNewOrders, pushStockLevel, testConnection };
