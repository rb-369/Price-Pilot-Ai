const DemandSignal = require('../models/DemandSignal');

exports.getDemandSignals = async (req, res) => {
    try {
        const { productId } = req.params;
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
        const signals = await DemandSignal.aggregate([
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
