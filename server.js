import "dotenv/config"; // Must be FIRST — loads .env before any other module reads process.env

import app from "./app.js";
import pool, { testConnection } from "./config/database.js";
import { closeRedis } from "./config/redis.js";

const port = process.env.PORT || 8080;

const server = app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // Test database connection at startup
  await testConnection();
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
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
