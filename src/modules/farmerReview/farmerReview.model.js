import pool from "../../config/database.js";

export const findDeliveredOrderForCustomer = async (orderId, customerId) => {
  const result = await pool.query(
    `SELECT o.id, o.status, o.customer_id, p.farmer_id
     FROM orders o
     JOIN products p ON p.id = o.product_id
     WHERE o.id = $1 AND o.customer_id = $2`,
    [orderId, customerId]
  );
  return result.rows[0] || null;
};

export const findByOrderId = async (orderId) => {
  const result = await pool.query(
    "SELECT id FROM farmer_reviews WHERE order_id = $1",
    [orderId]
  );
  return result.rows[0] || null;
};

export const create = async ({ orderId, farmerId, customerId, reliabilityRating, qualityRating, rating, feedback }) => {
  const result = await pool.query(
    `INSERT INTO farmer_reviews (order_id, farmer_id, customer_id, reliability_rating, quality_rating, rating, feedback)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, order_id, farmer_id, reliability_rating, quality_rating, rating, feedback, created_at`,
    [orderId, farmerId, customerId, reliabilityRating, qualityRating, rating, feedback || null]
  );
  return result.rows[0];
};

export const findByFarmerId = async (farmerId) => {
  const result = await pool.query(
    `SELECT fr.id, fr.order_id, fr.reliability_rating, fr.quality_rating, fr.rating, fr.feedback, fr.created_at,
            u.username AS customer_name
     FROM farmer_reviews fr
     JOIN users u ON u.id = fr.customer_id
     WHERE fr.farmer_id = $1
     ORDER BY fr.created_at DESC
     LIMIT 100`,
    [farmerId]
  );
  return result.rows;
};

export const getFarmerStats = async (farmerId) => {
  const result = await pool.query(
    `SELECT COALESCE(AVG(rating), 0)::numeric(10,2) AS avg_rating,
            COALESCE(AVG(reliability_rating), 0)::numeric(10,2) AS avg_reliability,
            COALESCE(AVG(quality_rating), 0)::numeric(10,2) AS avg_quality,
            COUNT(*) AS total_reviews
     FROM farmer_reviews
     WHERE farmer_id = $1`,
    [farmerId]
  );
  return result.rows[0];
};
