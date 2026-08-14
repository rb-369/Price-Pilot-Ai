const PlatformFeedback = require('../models/PlatformFeedback');
const { sendNotificationEmail } = require('../services/emailService');

exports.submitFeedback = async (req, res) => {
    try {
        const { rating, category, comment, pageUrl, name, email } = req.body;
        if (!comment) {
            return res.status(400).json({ success: false, message: 'Feedback comment is required' });
        }

        const userId = req.user ? req.user._id : null;
        const submitterName = req.user?.name || name || 'Anonymous';
        const submitterEmail = req.user?.email || email || '';

        const feedback = await PlatformFeedback.create({
            userId,
            name: submitterName,
            email: submitterEmail,
            rating: Number(rating) || 5,
            category: category || 'general',
            comment: comment.trim(),
            pageUrl: pageUrl || ''
        });

        // Fire-and-forget admin notification email if configured
        sendNotificationEmail(
            `💬 New Platform Feedback (${feedback.rating}★ - ${feedback.category})`,
            `<div style="font-family: sans-serif; padding: 20px; background: #0a0f1e; color: #f1f5f9; border-radius: 8px;">
                <h3 style="color: #6366f1;">New User Feedback Received</h3>
                <p><strong>User:</strong> ${submitterName} (${submitterEmail || 'N/A'})</p>
                <p><strong>Rating:</strong> ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)} (${feedback.rating}/5)</p>
                <p><strong>Category:</strong> ${feedback.category}</p>
                <p><strong>Page:</strong> ${feedback.pageUrl || 'N/A'}</p>
                <div style="background: #131b2e; padding: 15px; border-left: 4px solid #6366f1; margin: 15px 0;">
                    ${feedback.comment.replace(/\n/g, '<br/>')}
                </div>
            </div>`
        ).catch(() => {});

        res.status(201).json({
            success: true,
            message: 'Thank you for your feedback! It helps us improve PricePilot AI.',
            feedback,
            data: feedback
        });
    } catch (error) {
        console.error('[FeedbackController Error]', error);
        res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
    }
};

exports.getFeedbackList = async (req, res) => {
    try {
        const query = req.user?.role === 'admin' ? {} : { userId: req.user._id };
        const feedbackList = await PlatformFeedback.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: feedbackList });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
    }
};
