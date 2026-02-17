const express = require('express');
const router = express.Router();
const { getAlerts, getUnreadCount, markAsRead, markAllRead } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAlerts);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
