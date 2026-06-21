const express = require('express');
const router = express.Router();
const abTestController = require('../controllers/abTestController');
const { protect } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.post('/', abTestController.createTest);
router.get('/', abTestController.getTests);
router.get('/:id', abTestController.getTest);
router.post('/:id/record', abTestController.recordEvent);
router.put('/:id/complete', abTestController.completeTest);

module.exports = router;
