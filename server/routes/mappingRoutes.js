const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mappingController');
const { protect } = require('../middleware/auth');

router.use(protect);

// CRUD
router.get('/', mappingController.getMappings);
router.post('/', mappingController.createMapping);
router.delete('/:id', mappingController.deleteMapping);

// AI auto-match
router.post('/auto-match', mappingController.autoMatch);

// Confirm/reject AI suggestions
router.post('/:id/confirm', mappingController.confirmMapping);
router.post('/:id/reject', mappingController.rejectMapping);

module.exports = router;
