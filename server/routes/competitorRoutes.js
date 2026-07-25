const express = require('express');
const router = express.Router();
const { getCompetitorPrices, getAllLatestPrices, addCompetitorPrice, fetchLivePrices } = require('../controllers/competitorController');
const { protect } = require('../middleware/auth');

router.get('/latest', protect, getAllLatestPrices);
router.post('/fetch/:productId', protect, fetchLivePrices);
router.route('/:productId').get(protect, getCompetitorPrices).post(protect, addCompetitorPrice);

module.exports = router;
