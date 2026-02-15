import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Please set it in your .env file or environment variables."
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err.message);
});

export default pool;
