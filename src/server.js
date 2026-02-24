import "dotenv/config";

import app from "./app.js";
import pool, { testConnection, stopPoolMonitor } from "./config/database.js";
import { closeRedis } from "./config/redis.js";
import { initSocket } from "./config/socket.js";

const port = process.env.PORT || 8080;

const server = app.listen(port, async () => {
  await testConnection();
});

const io = initSocket(server);

// Graceful shutdown
const shutdown = async (signal) => {
  const forceExitTimer = setTimeout(() => {
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  stopPoolMonitor();
  io.close();

  server.close(() => {});
  try {
    await pool.end();
  } catch {
    // pool close failed silently
  }
  try {
    await closeRedis();
  } catch {
    // redis close failed silently
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
