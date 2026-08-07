/**
 * Adapter Factory
 * Returns the correct platform adapter based on platform name.
 * Each adapter implements a common interface:
 *   - fetchNewOrders(integration, sinceDate) → normalizedOrder[]
 *   - pushStockLevel(integration, product, quantity) → boolean
 *   - testConnection(integration) → { success, message }
 */

const shopifyAdapter = require('./shopifyAdapter');
const amazonAdapter = require('./amazonAdapter');
const flipkartAdapter = require('./flipkartAdapter');

const adapters = {
    shopify: shopifyAdapter,
    amazon: amazonAdapter,
    flipkart: flipkartAdapter,
};

/**
 * Get the adapter for a given platform.
 * @param {string} platform - 'shopify' | 'amazon' | 'flipkart'
 * @returns {Object} adapter with fetchNewOrders, pushStockLevel, testConnection
 * @throws {Error} if platform is not supported
 */
function getAdapter(platform) {
    const adapter = adapters[platform];
    if (!adapter) {
        throw new Error(`Unsupported platform: ${platform}. Supported: ${Object.keys(adapters).join(', ')}`);
    }
    return adapter;
}

/**
 * Check if a platform is supported.
 * @param {string} platform
 * @returns {boolean}
 */
function isSupported(platform) {
    return platform in adapters;
}

module.exports = { getAdapter, isSupported };
