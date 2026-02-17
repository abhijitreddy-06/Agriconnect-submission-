import { cacheGet, cacheSet } from "../config/redis.js";

/**
 * Express middleware factory for Redis caching.
 * Caches the JSON response for a given TTL.
 *
 * @param {Function} keyFn - Function that receives (req) and returns the cache key string
 * @param {number} ttlSeconds - Cache TTL in seconds (default: 300 = 5 min)
 */
export const cacheMiddleware = (keyFn, ttlSeconds = 300) => {
    return async (req, res, next) => {
        const cacheKey = keyFn(req);

        try {
            const cached = await cacheGet(cacheKey);
            if (cached) {
                return res.json(cached);
            }
        } catch (err) {
            // Redis failed, continue without cache
        }

        // Override res.json to intercept the response and cache it
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheSet(cacheKey, data, ttlSeconds).catch(() => { });
            }
            return originalJson(data);
        };

        next();
    };
};

export default cacheMiddleware;
