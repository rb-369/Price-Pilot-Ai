const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendPasswordResetEmail, getEmailStatus, sendTestEmail } = require('../services/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
    try {
        const { name, email, password, storeType } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        console.log(`Registration attempt for: ${email}`);

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password, storeType });
        const token = generateToken(user._id);

        console.log(`Registration successful for: ${email}`);

        // Send welcome email (fire-and-forget)
        sendWelcomeEmail(user).catch(err => {
            console.error('[Welcome Email Error]', err.message);
        });
        res.status(201).json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, storeType: user.storeType, token,
        });
    } catch (error) {
        console.error('REGISTRATION ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        console.log(`Login successful for: ${email}`);
        res.json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, storeType: user.storeType, token,
        });
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.googleAuth = async (req, res) => {
    try {
        const { email, name, googleId, picture } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Google email is required' });
        }
        console.log(`Google Auth attempt for: ${email}`);

        let user = await User.findOne({ email });
        if (!user) {
            // Auto-register user if first time
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: randomPassword,
                storeType: 'general',
            });
            console.log(`Google registration created new user for: ${email}`);

            // Send welcome email (fire-and-forget)
            sendWelcomeEmail(user).catch(err => {
                console.error('[Welcome Email Error - Google Auth]', err.message);
            });
        } else {
            console.log(`Google login matched existing user for: ${email}`);
        }

        const token = generateToken(user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            storeType: user.storeType,
            token,
        });
    } catch (error) {
        console.error('GOOGLE AUTH ERROR:', error);
        res.status(500).json({ message: error.message || 'Google authentication failed' });
    }
};

exports.getProfile = async (req, res) => {
    res.json(req.user);
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            name,
            storeType,
            storeName,
            phone,
            avatar,
            activeProfileId,
            profiles,
            preferences,
        } = req.body;

        if (name) user.name = name.trim();
        if (storeType) user.storeType = storeType;
        if (storeName !== undefined) user.storeName = storeName;
        if (phone !== undefined) user.phone = phone;
        if (avatar !== undefined) user.avatar = avatar;
        if (activeProfileId !== undefined) user.activeProfileId = activeProfileId;
        if (Array.isArray(profiles)) user.profiles = profiles;
        if (preferences && typeof preferences === 'object') {
            user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            storeType: user.storeType,
            storeName: user.storeName,
            phone: user.phone,
            avatar: user.avatar,
            activeProfileId: user.activeProfileId,
            profiles: user.profiles,
            preferences: user.preferences,
        });
    } catch (error) {
        console.error('UPDATE PROFILE ERROR:', error);
        res.status(500).json({ message: error.message || 'Failed to update profile' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('CHANGE PASSWORD ERROR:', error);
        res.status(500).json({ message: error.message || 'Failed to change password' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`Password reset requested for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`Reset requested for non-existent email: ${email}`);
            return res.status(200).json({ message: 'If that email exists, a reset link has been generated.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash it for DB storage
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        // Dev convenience: write the reset URL to a local file so it can be
        // retrieved without an email server. NEVER do this in production.
        if (process.env.NODE_ENV !== 'production') {
            try {
                const fs = require('fs');
                const path = require('path');
                fs.writeFileSync(path.join(__dirname, '..', 'reset-link-debug.txt'), resetUrl);
                console.log(`[Debug] Reset URL written to reset-link-debug.txt`);
            } catch (fsErr) {
                console.error('[Debug Error] Failed to write reset-link-debug.txt', fsErr.message);
            }
        }

        const emailResult = await sendPasswordResetEmail(email, resetUrl);
        const emailSent = Boolean(emailResult?.success);

        // Print to console for development convenience
        console.log('\n==================================================');
        console.log('🔑 PASSWORD RESET LINK GENERATED (SendGrid Flow)');
        console.log(`User Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`SendGrid Delivery: ${emailSent ? 'Sent ✅' : 'Logged only'}`);
        console.log('==================================================\n');

        res.status(200).json({
            message: emailSent
                ? 'Password reset email sent successfully via SendGrid.'
                : 'Password reset link generated and logged for development.'
        });
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        console.log(`Attempting password reset with token.`);

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('Password reset failed: Invalid or expired token.');
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        // Update password (pre-save hook hashes it)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log(`Password reset successful for user: ${user.email}`);
        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('RESET PASSWORD ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getEmailStatus = (req, res) => {
    try {
        const status = getEmailStatus();
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sendTestEmail = async (req, res) => {
    try {
        const targetEmail = req.body.email || req.user?.email;
        if (!targetEmail) {
            return res.status(400).json({ success: false, message: 'Target email address is required' });
        }
        const result = await sendTestEmail(targetEmail);
        res.json({ success: result.success, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
