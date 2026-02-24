import pool from "../config/database.js";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../config/redis.js";

// POST /api/reviews - Submit a review for a delivered order
export const createReview = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { order_id, rating, feedback } = req.body;

    // Verify order exists, belongs to customer, and is delivered
    const orderResult = await pool.query(
      `SELECT o.id, o.customer_id, o.product_id, o.status
       FROM orders o WHERE o.id = $1`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const order = orderResult.rows[0];

    if (order.customer_id !== customerId) {
      return res.status(403).json({ success: false, error: "You can only review your own orders." });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, error: "You can only review delivered orders." });
    }

    // Check if already reviewed
    const existingReview = await pool.query(
      "SELECT id FROM reviews WHERE order_id = $1",
      [order_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ success: false, error: "You have already reviewed this order." });
    }

    // Insert review
    const result = await pool.query(
      `INSERT INTO reviews (order_id, product_id, customer_id, rating, feedback)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, rating, feedback, created_at`,
      [order_id, order.product_id, customerId, rating, feedback || null]
    );

    // Invalidate review caches
    await cacheInvalidatePattern(`reviews:product:${order.product_id}`);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating review:", error.message);
    return res.status(500).json({ success: false, error: "Failed to submit review." });
  }
};

// GET /api/reviews/product/:productId - Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Check cache
    const cacheKey = `reviews:product:${productId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached });
    }

    // Get reviews
    const reviews = await pool.query(
      `SELECT r.id, r.rating, r.feedback, r.created_at, u.username AS customer_name
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    // Get average rating
    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews WHERE product_id = $1`,
      [productId]
    );

    const responseData = {
      reviews: reviews.rows,
      avgRating: parseFloat(parseFloat(avgResult.rows[0].avg_rating).toFixed(1)),
      totalReviews: parseInt(avgResult.rows[0].total_reviews),
    };

    // Cache for 3 minutes
    await cacheSet(cacheKey, responseData, 180);

    return res.json({ success: true, ...responseData });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch reviews." });
  }
};

// GET /api/reviews/check/:orderId - Check if order has been reviewed
export const checkReview = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const orderId = req.params.orderId;

    const result = await pool.query(
      "SELECT id, rating, feedback FROM reviews WHERE order_id = $1 AND customer_id = $2",
      [orderId, customerId]
    );

    return res.json({
      success: true,
      reviewed: result.rows.length > 0,
      review: result.rows[0] || null,
    });
  } catch (error) {
    console.error("Error checking review:", error.message);
    return res.status(500).json({ success: false, error: "Failed to check review status." });
  }
};
