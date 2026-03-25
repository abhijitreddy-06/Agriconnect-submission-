import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { default: app } = await import("./app.js");
const { default: pool, testConnection, stopPoolMonitor } = await import("./config/database.js");
const { closeRedis } = await import("./config/redis.js");
const { initSocket } = await import("./config/socket.js");

const port = process.env.PORT || 8080;

const server = app.listen(port, async () => {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error("[Startup] Database connection check failed. Verify DATABASE_URL in .env.");
  }
});

server.on("error", (error) => {
  console.error("[Startup] Server failed to start:", error.message);
  process.exit(1);
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
