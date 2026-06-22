const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // BullMQ requires null
    enableReadyCheck: true,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
    // Don't crash the whole server on connection errors.
    // BullMQ will retry; non-BullMQ code should check .status before use.
    lazyConnect: false,
});

redisClient.on('error', (err) => {
    // Suppress noisy logs in production; log only the first error per minute.
    if (!global.__lastRedisErrorLog || Date.now() - global.__lastRedisErrorLog > 60000) {
        console.error('⚠️  Redis error:', err.message);
        global.__lastRedisErrorLog = Date.now();
    }
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
    console.log('✅ Redis ready');
});

module.exports = redisClient;
