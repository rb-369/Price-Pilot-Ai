const express = require('express');
const router = express.Router();
const {
    register,
    login,
    googleAuth,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getEmailStatus,
    sendTestEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/email-status', getEmailStatus);
router.post('/test-email', protect, sendTestEmail);

module.exports = router;
