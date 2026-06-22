const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Modern Mongoose (8.x) sets sensible defaults for these,
            // but make them explicit so behavior is stable across versions.
            serverSelectionTimeoutMS: 10000, // fail fast if Mongo is unreachable
            socketTimeoutMS: 45000,
            maxPoolSize: 50,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB runtime error:', err.message);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected.');
        });

        return conn;
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
