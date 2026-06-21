const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
    try {
        const { name, email, password, storeType } = req.body;
        console.log(`Registration attempt for: ${email}`);

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password, storeType });
        const token = generateToken(user._id);

        console.log(`Registration successful for: ${email}`);
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

exports.getProfile = async (req, res) => {
    res.json(req.user);
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

        // Write to local file for sandboxed test verification
        try {
            const fs = require('fs');
            const path = require('path');
            fs.writeFileSync(path.join(__dirname, '..', 'reset-link-debug.txt'), resetUrl);
            console.log(`[Debug] Reset URL written to reset-link-debug.txt`);
        } catch (fsErr) {
            console.error('[Debug Error] Failed to write reset-link-debug.txt', fsErr.message);
        }

        let emailSent = false;
        if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
            try {
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msg = {
                    to: email,
                    from: process.env.SENDGRID_FROM_EMAIL,
                    subject: 'Password Reset Request - PricePilot AI',
                    text: `You requested a password reset for your PricePilot AI account.\n\n` +
                          `Please click on the following link or paste it into your browser to complete the process:\n\n` +
                          `${resetUrl}\n\n` +
                          `This link is valid for 1 hour. If you did not request this, please ignore this email.\n`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0a0f1e; color: #f1f5f9;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: bold;">PricePilot AI</h2>
                                <p style="color: #94a3b8; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;">Intelligence Platform</p>
                            </div>
                            <div style="background-color: #131b2e; padding: 24px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.1);">
                                <h3 style="color: #ffffff; margin-top: 0; font-size: 18px;">Password Reset Request</h3>
                                <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6;">You requested a password reset for your PricePilot AI account. Click the button below to set a new password. This link is valid for 1 hour.</p>
                                <div style="text-align: center; margin: 25px 0;">
                                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">Reset Password</a>
                                </div>
                                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
                            </div>
                            <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
                            <p style="font-size: 11px; color: #64748b; word-break: break-all; text-align: center;">If the button above doesn't work, copy and paste the following URL into your browser:<br/><span style="color: #6366f1;">${resetUrl}</span></p>
                        </div>
                    `,
                };
                await sgMail.send(msg);
                emailSent = true;
                console.log(`[SendGrid] Reset email sent to: ${email}`);
            } catch (err) {
                console.error('[SendGrid Error]: Failed to send reset email.', err.message);
            }
        }

        // Print to console for development convenience
        console.log('\n==================================================');
        console.log('🔑 PASSWORD RESET LINK GENERATED (SendGrid Flow)');
        console.log(`User Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('==================================================\n');

        res.status(200).json({ 
            message: emailSent 
                ? 'Password reset email sent successfully.' 
                : 'Password reset link logged to console for development.'
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
