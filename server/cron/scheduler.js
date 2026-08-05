const cron = require('node-cron');
const { scrapeCompetitorPrices } = require('../services/scraperService');
const { collectDemandSignals } = require('../services/demandService');
const { runGlobalInventoryCheck } = require('../services/inventoryMonitor');

function initCronJobs() {
    // Scrape competitor prices every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('[CRON] Running competitor price scrape...');
        try {
            await scrapeCompetitorPrices();
        } catch (err) {
            console.error('[CRON] Scrape failed:', err.message);
        }
    });

    // Collect demand signals every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        console.log('[CRON] Collecting demand signals...');
        try {
            await collectDemandSignals();
        } catch (err) {
            console.error('[CRON] Demand collection failed:', err.message);
        }
    });

    const { processRetraining } = require('../services/retrainService');
    cron.schedule('0 2 * * 0', async () => {
        console.log('[CRON] Starting weekly ML elasticity retraining...');
        try {
            await processRetraining();
        } catch (err) {
            console.error('[CRON] Retraining failed:', err.message);
        }
    });

    // Run global inventory low-stock check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await runGlobalInventoryCheck();
        } catch (err) {
            console.error('[CRON] Global inventory check failed:', err.message);
        }
    });

    console.log('[CRON] Scheduled jobs initialized');
}

module.exports = { initCronJobs };
