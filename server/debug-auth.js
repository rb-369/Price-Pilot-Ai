require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

console.log('--- DEBUG START ---');
console.log('Current Directory:', process.cwd());
console.log('ENV Loading Check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET is missing!');
}

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecom-ai');
        console.log('Connected to MongoDB');

        console.log('Attempting to create a test token...');
        try {
            const token = jwt.sign({ id: 'test' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log('Token created successfully:', token);
        } catch (err) {
            console.error('Token generation failed:', err.message);
        }

        console.log('Checking for existing users...');
        const users = await User.find({});
        console.log('User count:', users.length);

    } catch (error) {
        console.error('Database Connection Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('--- DEBUG END ---');
    }
};

run();
