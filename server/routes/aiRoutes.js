const express = require('express');
const router = express.Router();
const {
    getRecommendations, generateRecommendation, getForecast,
    generateForecast, acceptRecommendation, rejectRecommendation,
    getDashboardStats, getChartData,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/chart-data', protect, getChartData);
router.get('/recommendations', protect, getRecommendations);
router.post('/recommendations/:productId', protect, generateRecommendation);
router.put('/recommendations/:id/accept', protect, acceptRecommendation);
router.put('/recommendations/:id/reject', protect, rejectRecommendation);
router.get('/forecasts', protect, getForecast);
router.post('/forecasts/:productId', protect, generateForecast);

module.exports = router;
