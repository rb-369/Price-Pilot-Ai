const express = require('express');
const router = express.Router();
const {
    getRecommendations, generateRecommendation, getForecast,
    generateForecast, acceptRecommendation, rejectRecommendation,
    revertRecommendation,
    getDashboardStats, getChartData, chat, generateProductDescription,
    checkJobStatus
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { aiGenerationLimiter } = require('../middleware/rateLimiter');

// Read queries (dashboard-stats, chart-data, recommendations, forecasts) use standard limits
// Heavy generative mutations are explicitly throttled with aiGenerationLimiter

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/chart-data', protect, getChartData);
router.post('/chat', protect, aiGenerationLimiter, chat);
router.post('/generate-description', protect, aiGenerationLimiter, generateProductDescription);
router.get('/recommendations', protect, getRecommendations);
router.post('/recommendations/:productId', protect, aiGenerationLimiter, generateRecommendation);
router.put('/recommendations/:id/accept', protect, acceptRecommendation);
router.put('/recommendations/:id/reject', protect, rejectRecommendation);
router.put('/recommendations/:id/revert', protect, revertRecommendation);
router.get('/forecasts', protect, getForecast);
router.post('/forecasts/:productId', protect, aiGenerationLimiter, generateForecast);
router.get('/jobs/:jobId', protect, checkJobStatus);

module.exports = router;
