const Report = require('../models/Report');
const { sendNotificationEmail } = require('../services/emailService');

exports.submitReport = async (req, res) => {
    try {
        const { type, severity, title, description, pageUrl, systemInfo, name, email } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        const userId = req.user ? req.user._id : null;
        const submitterName = req.user?.name || name || 'Anonymous';
        const submitterEmail = req.user?.email || email || '';

        const report = await Report.create({
            userId,
            name: submitterName,
            email: submitterEmail,
            type: type || 'bug',
            severity: severity || 'medium',
            title: title.trim(),
            description: description.trim(),
            pageUrl: pageUrl || '',
            systemInfo: systemInfo || {}
        });

        // Fire-and-forget alert for critical/high severity reports
        sendNotificationEmail(
            `🚨 [${(report.severity).toUpperCase()}] Issue Reported: ${report.title}`,
            `<div style="font-family: sans-serif; padding: 20px; background: #0a0f1e; color: #f1f5f9; border-radius: 8px;">
                <h3 style="color: #ef4444;">Bug / Issue Reported</h3>
                <p><strong>Reporter:</strong> ${submitterName} (${submitterEmail || 'N/A'})</p>
                <p><strong>Type:</strong> ${report.type} | <strong>Severity:</strong> ${report.severity}</p>
                <p><strong>Page:</strong> ${report.pageUrl || 'N/A'}</p>
                <p><strong>Title:</strong> ${report.title}</p>
                <div style="background: #131b2e; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0;">
                    ${report.description.replace(/\n/g, '<br/>')}
                </div>
            </div>`
        ).catch(() => {});

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Our engineering team will review it shortly.',
            report
        });
    } catch (error) {
        console.error('[ReportController Error]', error);
        res.status(500).json({ message: 'Failed to submit report', error: error.message });
    }
};

exports.getReportsList = async (req, res) => {
    try {
        const query = req.user?.role === 'admin' ? {} : { userId: req.user._id };
        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
};
