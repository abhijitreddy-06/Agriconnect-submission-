import pool from "../../config/database.js";

export const getClient = async () => pool.connect();

export const findProductForUpdate = async (client, productId) => {
  const result = await client.query(
    "SELECT price, quantity AS stock, farmer_id FROM products WHERE id = $1 FOR UPDATE",
    [productId]
  );
  return result.rows[0] || null;
};

export const createOrder = async (client, customerId, productId, quantity, totalPrice, deliveryAddress) => {
  const result = await client.query(
    `INSERT INTO orders (customer_id, product_id, quantity, total_price, status, delivery_address)
     VALUES ($1, $2, $3, $4, 'pending', $5)
     RETURNING id`,
    [customerId, productId, quantity, totalPrice, deliveryAddress || null]
  );
  return result.rows[0];
};

export const reduceStock = async (client, productId, quantity) => {
  await client.query(
    "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
    [quantity, productId]
  );
};

export const restoreStock = async (client, productId, quantity) => {
  await client.query(
    "UPDATE products SET quantity = quantity + $1 WHERE id = $2",
    [quantity, productId]
  );
};

export const countOrders = async (role, userId) => {
  let baseWhere = "";
  let params = [];

  if (role === "customer") {
    baseWhere = "WHERE o.customer_id = $1";
    params = [userId];
  } else if (role === "farmer") {
    baseWhere = "WHERE p.farmer_id = $1";
    params = [userId];
  }

  const result = await pool.query(
    `SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id ${baseWhere}`,
    params
  );
  return { count: parseInt(result.rows[0].count), baseWhere, params };
};

export const findOrders = async (role, userId, limit, offset) => {
  let baseWhere = "";
  let params = [];

  if (role === "customer") {
    baseWhere = "WHERE o.customer_id = $1";
    params = [userId];
  } else if (role === "farmer") {
    baseWhere = "WHERE p.farmer_id = $1";
    params = [userId];
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id ${baseWhere}`,
    params.slice()
  );
  const total = parseInt(countResult.rows[0].count);

  const dataQuery = `SELECT o.*, p.product_name, p.price, u.username FROM orders o
           JOIN products p ON o.product_id = p.id
           JOIN users u ON ${role === "customer" ? "p.farmer_id" : "o.customer_id"} = u.id
           ${baseWhere}
           ORDER BY o.id DESC
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(dataQuery, params);
  return { rows: result.rows, total };
};

export const findOrderById = async (orderId) => {
  const result = await pool.query(
    `SELECT o.*, p.product_name, p.price, u.username FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN users u ON p.farmer_id = u.id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
};

export const findOrderForCancel = async (client, orderId) => {
  const result = await client.query(
    `SELECT o.id, o.customer_id, o.product_id, o.quantity, o.status
     FROM orders o WHERE o.id = $1 FOR UPDATE`,
    [orderId]
  );
  return result.rows[0] || null;
};

export const updateStatus = async (orderId, status, client) => {
  const conn = client || pool;
  await conn.query("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);
};

export const findOrderWithFarmer = async (orderId) => {
  const result = await pool.query(
    `SELECT o.status AS current_status, p.farmer_id FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
};
