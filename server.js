import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import pool from "./config/database.js";

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
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
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
