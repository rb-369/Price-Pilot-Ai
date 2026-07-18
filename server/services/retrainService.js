const axios = require('axios');
const FeedbackLog = require('../models/FeedbackLog');

const AI_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

exports.processRetraining = async () => {
    try {
        console.log('[Retrain] Fetching unprocessed feedback logs...');
        
        // Find logs that haven't been processed and are at least a few hours old
        // to ensure we've captured subsequent demand/stock data if possible.
        // In a real production system we'd wait 7 days, but for MVP we take any unprocessed.
        const pendingLogs = await FeedbackLog.find({ processedForRetraining: false });
        
        if (pendingLogs.length < 5) {
            console.log(`[Retrain] Not enough new data points (${pendingLogs.length}) for meaningful retraining.`);
            return { status: 'skipped', message: 'Insufficient new data points' };
        }

        // Format data for the ML service
        const trainingData = pendingLogs.map(log => {
            // Calculate observed elasticity: % change in demand / % change in price
            let elasticity = -1.5; // Default heuristic if we can't calculate
            
            if (log.priceAfterChange !== log.priceBeforeChange && log.demandScoreAfter && log.demandScoreBefore) {
                const priceChangePct = (log.priceAfterChange - log.priceBeforeChange) / log.priceBeforeChange;
                const demandChangePct = (log.demandScoreAfter - log.demandScoreBefore) / log.demandScoreBefore;
                
                if (priceChangePct !== 0) {
                    elasticity = demandChangePct / priceChangePct;
                    // Clamp to realistic values
                    elasticity = Math.max(-4.0, Math.min(elasticity, -0.1));
                }
            }
            
            // Save observed elasticity to log for analytics
            log.elasticityObserved = elasticity;

            return {
                features: log.features,
                elasticity_observed: elasticity
            };
        });

        console.log(`[Retrain] Sending ${trainingData.length} observations to ML service...`);
        
        const response = await axios.post(`${AI_URL}/api/retrain-elasticity`, {
            training_data: trainingData
        });

        // Mark as processed
        for (const log of pendingLogs) {
            log.processedForRetraining = true;
            await log.save();
        }

        console.log(`[Retrain] Success: ${JSON.stringify(response.data)}`);
        return response.data;

    } catch (error) {
        console.error('[Retrain] Error during retraining:', error.message);
        throw error;
    }
};
