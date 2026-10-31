const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // BullMQ requires null
    enableReadyCheck: false,
    retryStrategy(times) {
        // If max requests limit exceeded, back off aggressively (up to 30s)
        const delay = Math.min(times * 1000, 30000);
        return delay;
    },
    // Don't crash the whole server on connection errors.
    lazyConnect: false,
});

redisClient.on('error', (err) => {
    // Suppress noisy logs in production; log only once per 60 seconds.
    if (!global.__lastRedisErrorLog || Date.now() - global.__lastRedisErrorLog > 60000) {
        console.warn('⚠️  Redis warning/error:', err.message);
        global.__lastRedisErrorLog = Date.now();
    }
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
    console.log('✅ Redis ready');
});

/**
 * Safe Redis GET wrapper that NEVER throws.
 * If Redis is offline, disconnected, or max request limit is exceeded, returns null.
 */
redisClient.safeGet = async function (key) {
    try {
        if (redisClient.status === 'end') return null;
        return await redisClient.get(key);
    } catch (err) {
        // Fail open — cache miss
        return null;
    }
};

/**
 * Safe Redis SETEX wrapper that NEVER throws.
 * If Redis is offline or over quota, silently ignores.
 */
redisClient.safeSetEx = async function (key, ttl, value) {
    try {
        if (redisClient.status === 'end') return;
        await redisClient.setex(key, ttl, value);
    } catch (err) {
        // Fail open — bypass cache write
    }
};

module.exports = redisClient;
