const express = require('express');
const router = express.Router();
const { runSimulation, commitPriceChange } = require('../controllers/simulatorController');
const { protect } = require('../middleware/auth');
const { apiLimiter, aiGenerationLimiter } = require('../middleware/rateLimiter');

router.use(apiLimiter);

router.post('/run', protect, runSimulation);
router.post('/commit', protect, commitPriceChange);

module.exports = router;
