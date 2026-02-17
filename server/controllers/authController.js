const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
