import pool, { getPoolHealth } from "../../config/database.js";
import { isRedisAvailable, cacheGet, cacheSet } from "../../config/redis.js";

export const getSystemHealth = async () => {
  const dbHealth = await getPoolHealth();
  const redisUp = isRedisAvailable();
  const healthy = dbHealth.status === "healthy";

  return {
    healthy,
    payload: {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: { status: redisUp ? "connected" : "disconnected" },
      },
    },
  };
};

export const checkDatabase = async () => {
  const start = Date.now();
  const result = await pool.query("SELECT NOW() AS server_time, current_database() AS db_name");
  return {
    latencyMs: Date.now() - start,
    server: result.rows[0],
  };
};

export const checkRedis = async () => {
  const testKey = "health:test";
  const testValue = { timestamp: Date.now() };

  await cacheSet(testKey, testValue, 10);
  const retrieved = await cacheGet(testKey);

  return {
    connected: isRedisAvailable(),
    writeRead: retrieved !== null,
  };
};

export const getAuthConfigHealth = () => {
  return {
    jwt: process.env.JWT_SECRET ? "configured" : "missing",
    jwtRefresh: process.env.JWT_REFRESH_SECRET ? "configured" : "missing",
  };
};

export const getStorageConfigHealth = () => {
  return {
    supabaseUrl: process.env.SUPABASE_URL ? "configured" : "missing",
    supabaseKey: process.env.SUPABASE_KEY ? "configured" : "missing",
    bucket: process.env.SUPABASE_BUCKET || "not set",
  };
};

export const getEnvironmentHealth = () => {
  return {
    nodeEnv: process.env.NODE_ENV || "not set",
    port: process.env.PORT || "not set",
    baseUrl: process.env.BASE_URL || "not set",
    hfApiUrl: process.env.HF_API_URL ? "configured" : "missing",
  };
};

export const getAllHealthChecks = async () => {
  const results = {};

  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    results.database = { status: "ok", latencyMs: Date.now() - start };
  } catch (error) {
    results.database = { status: "error", error: error.message };
  }

  try {
    results.redis = {
      status: isRedisAvailable() ? "ok" : "disconnected",
    };

    if (isRedisAvailable()) {
      await cacheSet("health:ping", true, 5);
      const value = await cacheGet("health:ping");
      results.redis.readWrite = value !== null;
    }
  } catch (error) {
    results.redis = { status: "error", error: error.message };
  }

  results.config = {
    jwt: process.env.JWT_SECRET ? "ok" : "missing",
    jwtRefresh: process.env.JWT_REFRESH_SECRET ? "ok" : "missing",
    supabase: process.env.SUPABASE_URL && process.env.SUPABASE_KEY ? "ok" : "missing",
    hfApi: process.env.HF_API_URL ? "ok" : "missing",
  };

  const healthy =
    results.database.status === "ok" &&
    results.config.jwt === "ok" &&
    results.config.jwtRefresh === "ok";

  return {
    healthy,
    payload: {
      timestamp: new Date().toISOString(),
      results,
    },
  };
};
