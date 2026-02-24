import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  process.exit(1);
}

let dbHost = "unknown";
try {
  const parsed = new URL(process.env.DATABASE_URL);
  dbHost = `${parsed.hostname}:${parsed.port || 5432}`;
} catch {}

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

pool.on("error", (err) => {
  const code = err.code || "";
  const msg = err.message || "Unknown error";
  const transient = ["ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNREFUSED", "57P01", "57P03"];

  if (!transient.includes(code)) {
    console.error(`[DB] Unexpected pool error (${code}): ${msg}`);
  }
});

let monitorInterval = null;

function startPoolMonitor() {
  monitorInterval = setInterval(() => {}, 30000);
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

startPoolMonitor();

export const testConnection = async () => {
  try {
    await pool.query("SELECT NOW() AS server_time");

    try {
      await pool.query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'predictions' AND column_name = 'gemini_details'
          ) THEN
            ALTER TABLE predictions RENAME COLUMN gemini_details TO prediction_result;
          END IF;
        END $$;
      `);
    } catch {}

    try {
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'cart_items_customer_product_unique'
          ) THEN
            ALTER TABLE cart_items
              ADD CONSTRAINT cart_items_customer_product_unique
              UNIQUE (customer_id, product_id);
          END IF;
        END $$;
      `);
    } catch {}

    try {
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'delivery_address'
          ) THEN
            ALTER TABLE users ADD COLUMN delivery_address TEXT DEFAULT NULL;
          END IF;
        END $$;
      `);
    } catch {}

    try {
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'razorpay_order_id'
          ) THEN
            ALTER TABLE orders
              ADD COLUMN razorpay_order_id VARCHAR(255) DEFAULT NULL,
              ADD COLUMN razorpay_payment_id VARCHAR(255) DEFAULT NULL,
              ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
          END IF;
        END $$;
      `);
    } catch {}

    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          label VARCHAR(50) NOT NULL DEFAULT 'Home',
          full_name VARCHAR(100) NOT NULL,
          phone VARCHAR(15) NOT NULL,
          address_line1 VARCHAR(255) NOT NULL,
          address_line2 VARCHAR(255) DEFAULT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          pincode VARCHAR(10) NOT NULL,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    } catch {}

    return true;
  } catch (err) {
    console.error("[DB] Failed to connect:", err.message);
    return false;
  }
};

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
