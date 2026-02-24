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

const shutdown = async () => {
  const forceExitTimer = setTimeout(() => {
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  stopPoolMonitor();
  io.close();

  server.close(() => {});
  try { await pool.end(); } catch {}
  try { await closeRedis(); } catch {}
  process.exit(0);
};

process.on("SIGTERM", () => shutdown());
process.on("SIGINT", () => shutdown());
