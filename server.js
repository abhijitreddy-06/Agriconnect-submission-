import "dotenv/config"; // Must be FIRST — loads .env before any other module reads process.env

import app from "./app.js";
import pool, { testConnection, getPoolHealth, stopPoolMonitor } from "./config/database.js";
import { closeRedis } from "./config/redis.js";

const port = process.env.PORT || 8080;

// --- Health Check Endpoint ---
app.get("/db-health", async (req, res) => {
  const health = await getPoolHealth();
  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});

const server = app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // Test database connection at startup
  await testConnection();
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Force exit after 10 seconds if shutdown hangs
  const forceExitTimer = setTimeout(() => {
    console.error("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  // Stop pool monitoring
  stopPoolMonitor();

  server.close(() => {
    console.log("HTTP server closed.");
  });
  try {
    await pool.end();
    console.log("Database pool closed.");
  } catch (err) {
    console.error("Error closing database pool:", err.message);
  }
  try {
    await closeRedis();
  } catch (err) {
    console.error("Error closing Redis:", err.message);
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
