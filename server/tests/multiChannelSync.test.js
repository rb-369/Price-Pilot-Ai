const dbHandler = require('./setup');
const { getAdapter, isSupported } = require('../services/adapters/adapterFactory');
const { matchProduct } = require('../services/productMatchingService');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Multi-Channel Sync Adapters & Services', () => {
    test('adapterFactory returns supported adapters', () => {
        expect(isSupported('shopify')).toBe(true);
        expect(isSupported('amazon')).toBe(true);
        expect(isSupported('flipkart')).toBe(true);
        expect(isSupported('unsupported')).toBe(false);

        const shopify = getAdapter('shopify');
        expect(typeof shopify.fetchNewOrders).toBe('function');
        expect(typeof shopify.pushStockLevel).toBe('function');

        const amazon = getAdapter('amazon');
        expect(typeof amazon.fetchNewOrders).toBe('function');
        expect(typeof amazon.pushStockLevel).toBe('function');

        const flipkart = getAdapter('flipkart');
        expect(typeof flipkart.fetchNewOrders).toBe('function');
        expect(typeof flipkart.pushStockLevel).toBe('function');
    });

    test('Shopify adapter mock mode generates normalized orders', async () => {
        const adapter = getAdapter('shopify');
        const orders = await adapter.fetchNewOrders({ shopUrl: 'test.myshopify.com' }, new Date());
        expect(Array.isArray(orders)).toBe(true);
        if (orders.length > 0) {
            expect(orders[0]).toHaveProperty('externalOrderId');
            expect(orders[0]).toHaveProperty('source', 'shopify_poll');
            expect(orders[0]).toHaveProperty('quantity');
        }
    });

    test('Amazon adapter mock mode generates normalized orders', async () => {
        const adapter = getAdapter('amazon');
        const orders = await adapter.fetchNewOrders({ sellerId: 'TEST_SELLER' }, new Date());
        expect(Array.isArray(orders)).toBe(true);
        if (orders.length > 0) {
            expect(orders[0]).toHaveProperty('externalOrderId');
            expect(orders[0]).toHaveProperty('source', 'amazon_poll');
        }
    });

    test('Flipkart adapter mock mode generates normalized orders', async () => {
        const adapter = getAdapter('flipkart');
        const orders = await adapter.fetchNewOrders({ sellerId: 'TEST_APP' }, new Date());
        expect(Array.isArray(orders)).toBe(true);
        if (orders.length > 0) {
            expect(orders[0]).toHaveProperty('externalOrderId');
            expect(orders[0]).toHaveProperty('source', 'flipkart_poll');
        }
    });

    test('matchProduct returns unmatched when no product exists', async () => {
        const result = await matchProduct('507f1f77bcf86cd799439011', {
            sku: 'NON_EXISTENT_SKU_12345',
            externalId: 'EXT_9999',
            productName: 'Random Test Item XYZ'
        }, 'shopify');

        expect(result.product).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.matchType).toBe('unmatched');
    });
});
