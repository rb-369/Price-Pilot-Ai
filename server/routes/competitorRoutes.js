const express = require('express');
const router = express.Router();
const { getCompetitorPrices, getAllLatestPrices, addCompetitorPrice } = require('../controllers/competitorController');
const { protect } = require('../middleware/auth');

router.get('/latest', protect, getAllLatestPrices);
router.route('/:productId').get(protect, getCompetitorPrices).post(protect, addCompetitorPrice);

module.exports = router;
