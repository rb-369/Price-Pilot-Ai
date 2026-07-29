const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-key-123';
process.env.NODE_ENV = 'test';

let mongoServer;

module.exports.connect = async () => {
    mongoServer = await MongoMemoryServer.create({
        instance: {
            launchTimeout: 60000,
        },
    });
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
};

module.exports.closeDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
};

module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};
