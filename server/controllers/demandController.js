const DemandSignal = require('../models/DemandSignal');

exports.getDemandSignals = async (req, res) => {
    try {
        const { productId } = req.params;
        // Verify product belongs to user
        const product = await require('../models/Product').findOne({ _id: productId, userId: req.user._id });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const signals = await DemandSignal.find({ productId })
            .sort({ timestamp: -1 })
            .limit(60);
        res.json(signals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllDemandSignals = async (req, res) => {
    try {
        const userProducts = await require('../models/Product').find({ userId: req.user._id }).select('_id');
        const productIds = userProducts.map(p => p._id);

        const signals = await DemandSignal.aggregate([
            { $match: { productId: { $in: productIds } } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$productId',
                    latestSignal: { $first: '$$ROOT' },
                    avgDemandScore: { $avg: '$compositeDemandScore' },
                }
            },
            {
                $lookup: {
                    from: 'products', localField: '_id',
                    foreignField: '_id', as: 'product',
                }
            },
            { $unwind: '$product' },
        ]);
        res.json(signals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addDemandSignal = async (req, res) => {
    try {
        const signal = await DemandSignal.create(req.body);
        res.status(201).json(signal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
