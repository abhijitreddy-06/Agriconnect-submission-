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
  console.log("PostgreSQL pool: new client connected");
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

/**
 * Test the database connection and log the result.
 * Call this once at startup to verify Supabase PostgreSQL is reachable.
 */
export const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");
    console.log(`Connected to Supabase PostgreSQL — server time: ${result.rows[0].server_time}`);
    return true;
  } catch (err) {
    console.error("Failed to connect to Supabase PostgreSQL!");
    console.error("  Error:", err.message);
    if (err.code) console.error("  Code:", err.code);
    if (err.code === "ENOTFOUND") {
      console.error("  Cause: Database host not found. Check DATABASE_URL hostname.");
    } else if (err.code === "ECONNREFUSED") {
      console.error("  Cause: Connection refused. Check if database is running and port is correct.");
    } else if (err.code === "28P01") {
      console.error("  Cause: Authentication failed. Check database username/password in DATABASE_URL.");
    } else if (err.code === "3D000") {
      console.error("  Cause: Database does not exist. Check database name in DATABASE_URL.");
    } else if (err.code === "ETIMEDOUT") {
      console.error("  Cause: Connection timed out. Check network/firewall or if Supabase project is paused.");
    }
    return false;
  }
};

export default pool;
