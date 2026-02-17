const cron = require('node-cron');
const { scrapeCompetitorPrices } = require('../services/scraperService');
const { collectDemandSignals } = require('../services/demandService');

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

    console.log('[CRON] Scheduled jobs initialized');
}

module.exports = { initCronJobs };
