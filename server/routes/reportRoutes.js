const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional auth middleware
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        }
    } catch (e) {
        // Continue unauthenticated
    }
    next();
};

router.post('/', optionalAuth, reportController.submitReport);
router.get('/', protect, reportController.getReportsList);

module.exports = router;
