import { cacheGet, cacheSet } from "../config/redis.js";

export const cacheMiddleware = (keyFn, ttlSeconds = 300) => {
  return async (req, res, next) => {
    const cacheKey = keyFn(req);

    try {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    } catch {
      // Redis failed, continue without cache
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(cacheKey, data, ttlSeconds).catch(() => {});
      }
      return originalJson(data);
    };

    next();
  };
};

export default cacheMiddleware;
