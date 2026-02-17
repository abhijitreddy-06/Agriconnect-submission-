import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis = null;
let isRedisConnected = false;

try {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 5) {
                console.warn("Redis: Max retries reached. Falling back to no-cache mode.");
                return null; // stop retrying
            }
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        tls: REDIS_URL.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    });

    redis.on("connect", () => {
        isRedisConnected = true;
        console.log("Connected to Redis");
    });

    redis.on("error", (err) => {
        isRedisConnected = false;
        console.error("Redis error:", err.message);
    });

    redis.on("close", () => {
        isRedisConnected = false;
        console.log("Redis connection closed");
    });

    // Attempt connection
    await redis.connect().catch((err) => {
        console.warn("Redis initial connection failed:", err.message);
        console.warn("App will run without caching.");
    });
} catch (err) {
    console.warn("Redis setup failed:", err.message);
    console.warn("App will run without caching.");
}

/**
 * Safe Redis GET - returns null if Redis is unavailable
 */
export const cacheGet = async (key) => {
    if (!redis || !isRedisConnected) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error("Redis GET error:", err.message);
        return null;
    }
};

/**
 * Safe Redis SET with TTL (seconds)
 */
export const cacheSet = async (key, value, ttlSeconds = 300) => {
    if (!redis || !isRedisConnected) return;
    try {
        await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
        console.error("Redis SET error:", err.message);
    }
};

/**
 * Safe Redis DEL - delete one or more keys
 */
export const cacheDel = async (...keys) => {
    if (!redis || !isRedisConnected) return;
    try {
        await redis.del(...keys);
    } catch (err) {
        console.error("Redis DEL error:", err.message);
    }
};

/**
 * Invalidate all keys matching a pattern (e.g., "products:*")
 */
export const cacheInvalidatePattern = async (pattern) => {
    if (!redis || !isRedisConnected) return;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (err) {
        console.error("Redis pattern invalidation error:", err.message);
    }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = () => isRedisConnected;

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async () => {
    if (redis) {
        try {
            await redis.quit();
            console.log("Redis connection closed gracefully.");
        } catch (err) {
            console.error("Error closing Redis:", err.message);
        }
    }
};

export default redis;
