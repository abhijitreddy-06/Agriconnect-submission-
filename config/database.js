import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Please set it in your .env file or environment variables."
  );
  process.exit(1);
}

// Parse DATABASE_URL to log connection target (without credentials)
let dbHost = "unknown";
try {
  const parsed = new URL(process.env.DATABASE_URL);
  dbHost = `${parsed.hostname}:${parsed.port || 5432}`;
} catch {
  // ignore parse errors
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  application_name: "AgriConnect",

  ssl: {
    rejectUnauthorized: false,
  },
});



// --- Pool Event Handlers ---

pool.on("connect", (client) => {
  console.log(`[DB] New client connected (pool: ${pool.totalCount} total, ${pool.idleCount} idle)`);

  // Set statement timeout per-connection as a safety net
  client.query(`SET statement_timeout = '${parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000}'`).catch(() => {});
});

pool.on("acquire", () => {
  // Client checked out from pool — no action needed
});

pool.on("remove", () => {
  console.log(`[DB] Client removed from pool (${pool.totalCount} total, ${pool.idleCount} idle)`);
});

pool.on("error", (err) => {
  const code = err.code || "";
  const msg = err.message || "Unknown error";

  // Transient errors that will auto-recover on next connect
  const transient = ["ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNREFUSED", "57P01", "57P03"];

  if (transient.includes(code)) {
    console.warn(`[DB] Transient pool error (${code}): ${msg} — will auto-reconnect`);
  } else {
    console.error(`[DB] Unexpected pool error (${code}): ${msg}`);
  }
});

// --- Pool Monitoring (every 30 seconds) ---

let monitorInterval = null;

function startPoolMonitor() {
  monitorInterval = setInterval(() => {
    console.log(
      `[DB Monitor] total: ${pool.totalCount}, idle: ${pool.idleCount}, waiting: ${pool.waitingCount}`
    );
  }, 30000);

  // Don't prevent process from exiting
  if (monitorInterval.unref) {
    monitorInterval.unref();
  }
}

function stopPoolMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

// Start monitoring
startPoolMonitor();

/**
 * Test the database connection and log the result.
 * Call this once at startup to verify Supabase PostgreSQL is reachable.
 */
export const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");
    console.log(`[DB] Connected to Supabase PostgreSQL at ${dbHost}`);
    console.log(`[DB] Server time: ${result.rows[0].server_time}`);
    console.log(`[DB] Pool config — max: ${pool.options.max}, idleTimeout: ${pool.options.idleTimeoutMillis}ms, connectTimeout: ${pool.options.connectionTimeoutMillis}ms`);

    // Auto-migrate: rename gemini_details → prediction_result if needed
    try {
      await pool.query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'predictions' AND column_name = 'gemini_details'
          ) THEN
            ALTER TABLE predictions RENAME COLUMN gemini_details TO prediction_result;
            RAISE NOTICE 'Migrated gemini_details → prediction_result';
          END IF;
        END $$;
      `);
    } catch (migErr) {
      console.warn("[DB] Auto-migration check failed:", migErr.message);
    }

    return true;
  } catch (err) {
    console.error("[DB] Failed to connect to Supabase PostgreSQL!");
    console.error("  Error:", err.message);
    if (err.code) console.error("  Code:", err.code);
    if (err.code === "ENOTFOUND") {
      console.error("  Cause: Database host not found. Check DATABASE_URL hostname.");
    } else if (err.code === "ECONNREFUSED") {
      console.error("  Cause: Connection refused. Check if database is running and port is correct.");
    } else if (err.code === "28P01") {
      console.error("  Cause: Authentication failed. Check database username/password.");
    } else if (err.code === "3D000") {
      console.error("  Cause: Database does not exist. Check database name.");
    } else if (err.code === "ETIMEDOUT") {
      console.error("  Cause: Connection timed out. Check network/firewall or if Supabase project is paused.");
    } else if (err.message?.includes("self-signed certificate") || err.code === "SELF_SIGNED_CERT_IN_CHAIN") {
      console.error("  Cause: SSL certificate rejected. Ensure ssl.rejectUnauthorized is false for Supabase pooler.");
    }
    return false;
  }
};

/**
 * Get pool health information for the /db-health endpoint.
 */
export const getPoolHealth = async () => {
  const stats = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: pool.options.max,
  };

  try {
    const start = Date.now();
    const result = await pool.query("SELECT NOW() AS server_time");
    const latencyMs = Date.now() - start;

    return {
      status: "healthy",
      latencyMs,
      serverTime: result.rows[0].server_time,
      pool: stats,
      host: dbHost,
    };
  } catch (err) {
    return {
      status: "unhealthy",
      error: err.message,
      code: err.code,
      pool: stats,
      host: dbHost,
    };
  }
};

export { stopPoolMonitor };
export default pool;
