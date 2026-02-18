import pool from "../config/database.js";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../config/redis.js";

// POST /api/orders - Create a new order (validated by Zod middleware)
export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const customerId = req.user.userId;
    const { product_id, quantity, delivery_address } = req.body;

    await client.query("BEGIN");

    // Get product details with row lock
    const productResult = await client.query(
      "SELECT price, quantity AS stock, farmer_id FROM products WHERE id = $1 FOR UPDATE",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "Product not found.",
      });
    }

    const product = productResult.rows[0];

    if (product.farmer_id === customerId) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: "You cannot order your own product.",
      });
    }

    if (parseFloat(product.stock) < quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Only ${product.stock} available.`,
      });
    }

    const totalPrice = parseFloat(product.price) * quantity;

    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, product_id, quantity, total_price, status, delivery_address)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id`,
      [customerId, product_id, quantity, totalPrice, delivery_address || null]
    );

    // Reduce product stock
    await client.query(
      "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
      [quantity, product_id]
    );

    await client.query("COMMIT");

    // Invalidate caches
    await cacheInvalidatePattern("orders:*");
    await cacheInvalidatePattern("products:*");

    return res.status(201).json({
      success: true,
      orderId: orderResult.rows[0].id,
      message: "Order created successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating order:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create order.",
    });
  } finally {
    client.release();
  }
};

// GET /api/orders - Get orders for user (cached 2 min, with pagination)
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;

    // Check cache
    const cacheKey = `orders:${role}:${userId}:page:${page}:limit:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ success: true, ...cached });
    }

    let baseWhere = "";
    let params = [];

    if (role === "customer") {
      baseWhere = "WHERE o.customer_id = $1";
      params = [userId];
    } else if (role === "farmer") {
      baseWhere = "WHERE p.farmer_id = $1";
      params = [userId];
    }

    // Count total
    const countQuery = `SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id = p.id ${baseWhere}`;
    const countResult = await pool.query(countQuery, params.slice());
    const total = parseInt(countResult.rows[0].count);

    // Fetch paginated data
    const dataQuery = `SELECT o.*, p.product_name, p.price, u.username FROM orders o
             JOIN products p ON o.product_id = p.id
             JOIN users u ON ${role === "customer" ? "p.farmer_id" : "o.customer_id"} = u.id
             ${baseWhere}
             ORDER BY o.id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(dataQuery, params);

    const totalPages = Math.ceil(total / limit);
    const responseData = { data: result.rows, total, page, limit, totalPages };

    // Cache for 2 minutes
    await cacheSet(cacheKey, responseData, 120);

    return res.json({
      success: true,
      ...responseData,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch orders.",
    });
  }
};

// GET /api/orders/:id - Get single order
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.id;

    const result = await pool.query(
      `SELECT o.*, p.product_name, p.price, u.username FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON p.farmer_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found.",
      });
    }

    const order = result.rows[0];

    // Verify access
    if (order.customer_id !== userId && order.farmer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to view this order.",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch order.",
    });
  }
};

// PUT /api/orders/:id/cancel - Customer cancels their order
export const cancelOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const customerId = req.user.userId;
    const orderId = req.params.id;

    await client.query("BEGIN");

    // Get order with product details (lock row)
    const orderResult = await client.query(
      `SELECT o.id, o.customer_id, o.product_id, o.quantity, o.status
       FROM orders o WHERE o.id = $1 FOR UPDATE`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const order = orderResult.rows[0];

    // Verify the customer owns this order
    if (order.customer_id !== customerId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ success: false, error: "You can only cancel your own orders." });
    }

    // Only allow cancellation if pending or accepted
    if (!["pending", "accepted"].includes(order.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: `Cannot cancel an order that is already "${order.status}".`,
      });
    }

    // Update order status to cancelled
    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);

    // Restore product stock
    await client.query(
      "UPDATE products SET quantity = quantity + $1 WHERE id = $2",
      [order.quantity, order.product_id]
    );

    await client.query("COMMIT");

    // Invalidate caches
    await cacheInvalidatePattern("orders:*");
    await cacheInvalidatePattern("products:*");

    return res.json({ success: true, message: "Order cancelled successfully. Stock has been restored." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cancelling order:", error.message);
    return res.status(500).json({ success: false, error: "Failed to cancel order." });
  } finally {
    client.release();
  }
};

// PUT /api/orders/:id - Update order status (validated by Zod middleware, farmer-only via requireRole)
export const updateOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.id;
    const { status } = req.body;

    // Verify farmer owns the product and get current order status
    const orderResult = await pool.query(
      `SELECT o.status AS current_status, p.farmer_id FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found.",
      });
    }

    if (orderResult.rows[0].farmer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to update this order.",
      });
    }

    // Enforce valid forward-only transitions
    const validTransitions = {
      pending: ["accepted"],
      accepted: ["shipped"],
      shipped: ["delivered"],
    };

    const currentStatus = orderResult.rows[0].current_status;
    const allowed = validTransitions[currentStatus] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from '${currentStatus}' to '${status}'.`,
      });
    }

    // Update order
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      orderId,
    ]);

    // Invalidate order caches
    await cacheInvalidatePattern("orders:*");

    return res.json({
      success: true,
      message: "Order updated successfully.",
    });
  } catch (error) {
    console.error("Error updating order:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update order.",
    });
  }
};
