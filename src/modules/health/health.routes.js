import express from "express";
import pool, { getPoolHealth } from "../../config/database.js";
import { isRedisAvailable, cacheGet, cacheSet } from "../../config/redis.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const dbHealth = await getPoolHealth();
  const redisUp = isRedisAvailable();

  const allHealthy = dbHealth.status === "healthy";

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
      redis: { status: redisUp ? "connected" : "disconnected" },
    },
  });
});

router.get("/db", async (_req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query("SELECT NOW() AS server_time, current_database() AS db_name");
    const latencyMs = Date.now() - start;

    res.json({
      success: true,
      test: "database",
      latencyMs,
      data: result.rows[0],
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      test: "database",
      error: err.message,
    });
  }
});

router.get("/redis", async (_req, res) => {
  try {
    const testKey = "health:test";
    const testValue = { timestamp: Date.now() };

    await cacheSet(testKey, testValue, 10);
    const retrieved = await cacheGet(testKey);

    res.json({
      success: true,
      test: "redis",
      connected: isRedisAvailable(),
      writeRead: retrieved !== null,
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      test: "redis",
      error: err.message,
    });
  }
});

router.get("/auth", (_req, res) => {
  try {
    const jwt = process.env.JWT_SECRET ? "configured" : "missing";
    const jwtRefresh = process.env.JWT_REFRESH_SECRET ? "configured" : "missing";

    res.json({
      success: true,
      test: "auth-config",
      jwt,
      jwtRefresh,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      test: "auth-config",
      error: err.message,
    });
  }
});

router.get("/storage", (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL ? "configured" : "missing";
  const supabaseKey = process.env.SUPABASE_KEY ? "configured" : "missing";
  const bucket = process.env.SUPABASE_BUCKET || "not set";

  res.json({
    success: true,
    test: "storage-config",
    supabaseUrl,
    supabaseKey,
    bucket,
  });
});

router.get("/env", (_req, res) => {
  res.json({
    success: true,
    test: "environment",
    nodeEnv: process.env.NODE_ENV || "not set",
    port: process.env.PORT || "not set",
    baseUrl: process.env.BASE_URL || "not set",
    hfApiUrl: process.env.HF_API_URL ? "configured" : "missing",
  });
});

router.get("/all", async (_req, res) => {
  const results = {};

  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    results.database = { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    results.database = { status: "error", error: err.message };
  }

  try {
    results.redis = {
      status: isRedisAvailable() ? "ok" : "disconnected",
    };
    if (isRedisAvailable()) {
      await cacheSet("health:ping", true, 5);
      const got = await cacheGet("health:ping");
      results.redis.readWrite = got !== null;
    }
  } catch (err) {
    results.redis = { status: "error", error: err.message };
  }

  results.config = {
    jwt: process.env.JWT_SECRET ? "ok" : "missing",
    jwtRefresh: process.env.JWT_REFRESH_SECRET ? "ok" : "missing",
    supabase: process.env.SUPABASE_URL && process.env.SUPABASE_KEY ? "ok" : "missing",
    hfApi: process.env.HF_API_URL ? "ok" : "missing",
  };

  const allOk = results.database.status === "ok" &&
    results.config.jwt === "ok" &&
    results.config.jwtRefresh === "ok";

  res.status(allOk ? 200 : 503).json({
    success: allOk,
    timestamp: new Date().toISOString(),
    results,
  });
});

export default router;
