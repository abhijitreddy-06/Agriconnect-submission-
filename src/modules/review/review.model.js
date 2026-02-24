import pool from "../../config/database.js";

export const findOrder = async (orderId) => {
  const result = await pool.query(
    `SELECT o.id, o.customer_id, o.product_id, o.status
     FROM orders o WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
};

export const findByOrderId = async (orderId) => {
  const result = await pool.query(
    "SELECT id FROM reviews WHERE order_id = $1",
    [orderId]
  );
  return result.rows[0] || null;
};

export const create = async (orderId, productId, customerId, rating, feedback) => {
  const result = await pool.query(
    `INSERT INTO reviews (order_id, product_id, customer_id, rating, feedback)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, rating, feedback, created_at`,
    [orderId, productId, customerId, rating, feedback || null]
  );
  return result.rows[0];
};

export const findByProductId = async (productId) => {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.feedback, r.created_at, u.username AS customer_name
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return result.rows;
};

export const getAverageRating = async (productId) => {
  const result = await pool.query(
    `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews
     FROM reviews WHERE product_id = $1`,
    [productId]
  );
  return result.rows[0];
};

export const findByOrderAndCustomer = async (orderId, customerId) => {
  const result = await pool.query(
    "SELECT id, rating, feedback FROM reviews WHERE order_id = $1 AND customer_id = $2",
    [orderId, customerId]
  );
  return result.rows[0] || null;
};
