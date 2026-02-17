const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({})
            .populate('productId', 'name sku')
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Alert.countDocuments({ read: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        if (!alert) return res.status(404).json({ message: 'Alert not found' });
        res.json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Alert.updateMany({ read: false }, { read: true });
        res.json({ message: 'All alerts marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
