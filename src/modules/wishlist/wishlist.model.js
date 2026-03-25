import pool from "../../config/database.js";

export const findByCustomerAndProduct = async (customerId, productId) => {
  const result = await pool.query(
    "SELECT id FROM wishlist WHERE customer_id = $1 AND product_id = $2",
    [customerId, productId]
  );
  return result.rows[0] || null;
};

export const create = async (customerId, productId, priceAtAdd) => {
  await pool.query(
    `INSERT INTO wishlist (customer_id, product_id, price_at_add)
     VALUES ($1, $2, $3)
     ON CONFLICT (customer_id, product_id) DO NOTHING`,
    [customerId, productId, priceAtAdd]
  );
};

export const remove = async (customerId, productId) => {
  await pool.query(
    "DELETE FROM wishlist WHERE customer_id = $1 AND product_id = $2",
    [customerId, productId]
  );
};

export const findWishlistByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT w.product_id, w.price_at_add, w.created_at,
            p.product_name, p.price, p.image, p.category, p.quality,
            p.is_organic, p.is_eco_certified,
            u.username AS farmer_name,
            COALESCE(pr.avg_rating, 0) AS product_avg_rating,
            COALESCE(pr.total_reviews, 0) AS product_total_reviews
     FROM wishlist w
     JOIN products p ON p.id = w.product_id
     LEFT JOIN users u ON u.id = p.farmer_id
     LEFT JOIN (
       SELECT product_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews
       GROUP BY product_id
     ) pr ON pr.product_id = p.id
     WHERE w.customer_id = $1
     ORDER BY w.created_at DESC`,
    [customerId]
  );
  return result.rows;
};

export const findPriceDropsByCustomer = async (customerId) => {
  const result = await pool.query(
    `SELECT w.product_id, w.price_at_add, p.price AS current_price, p.product_name, p.image
     FROM wishlist w
     JOIN products p ON p.id = w.product_id
     WHERE w.customer_id = $1 AND p.price < w.price_at_add
     ORDER BY (w.price_at_add - p.price) DESC`,
    [customerId]
  );
  return result.rows;
};
