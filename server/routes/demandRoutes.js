const express = require('express');
const router = express.Router();
const { getDemandSignals, getAllDemandSignals, addDemandSignal } = require('../controllers/demandController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllDemandSignals);
router.route('/:productId').get(protect, getDemandSignals).post(protect, addDemandSignal);

module.exports = router;
