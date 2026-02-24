import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis = null;
let isRedisConnected = false;

try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 10000,
    tls: REDIS_URL.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
  });

  redis.on("connect", () => {
    isRedisConnected = true;
  });

  redis.on("error", () => {
    isRedisConnected = false;
  });

  redis.on("close", () => {
    isRedisConnected = false;
  });

  await redis.connect().catch(() => {});
} catch {
  // Redis setup failed, app will run without caching
}

export const cacheGet = async (key) => {
  if (!redis || !isRedisConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!redis || !isRedisConnected) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // cache set failed silently
  }
};

export const cacheDel = async (...keys) => {
  if (!redis || !isRedisConnected) return;
  try {
    await redis.del(...keys);
  } catch {
    // cache del failed silently
  }
};

export const cacheInvalidatePattern = async (pattern) => {
  if (!redis || !isRedisConnected) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // pattern invalidation failed silently
  }
};

export const isRedisAvailable = () => isRedisConnected;

export const closeRedis = async () => {
  if (redis) {
    try {
      await redis.quit();
    } catch {
      // close failed silently
    }
  }
};

export default redis;
