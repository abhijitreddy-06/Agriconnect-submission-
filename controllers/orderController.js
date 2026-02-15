import pool from "../config/database.js";

// POST /api/orders - Create a new order
export const createOrder = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Product ID and quantity are required.",
      });
    }

    // Get product details
    const productResult = await pool.query(
      "SELECT price FROM products WHERE id = $1",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found.",
      });
    }

    const price = productResult.rows[0].price;
    const totalPrice = parseFloat(price) * parseFloat(quantity);

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (customer_id, product_id, quantity, total_price, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [customerId, product_id, parseFloat(quantity), totalPrice]
    );

    return res.status(201).json({
      success: true,
      orderId: orderResult.rows[0].id,
      message: "Order created successfully.",
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create order.",
    });
  }
};

// GET /api/orders - Get orders for user
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let query = "";
    let params = [];

    if (role === "customer") {
      query = `SELECT o.*, p.product_name, p.price, u.username FROM orders o
               JOIN products p ON o.product_id = p.id
               JOIN users u ON p.farmer_id = u.id
               WHERE o.customer_id = $1
               ORDER BY o.id DESC`;
      params = [userId];
    } else if (role === "farmer") {
      query = `SELECT o.*, p.product_name, p.price, u.username FROM orders o
               JOIN products p ON o.product_id = p.id
               JOIN users u ON o.customer_id = u.id
               WHERE p.farmer_id = $1
               ORDER BY o.id DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows,
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

// PUT /api/orders/:id - Update order status (farmers only)
export const updateOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const orderId = req.params.id;
    const { status } = req.body;

    if (role !== "farmer") {
      return res.status(403).json({
        success: false,
        error: "Only farmers can update orders.",
      });
    }

    if (!["pending", "accepted", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: pending, accepted, shipped, or delivered.",
      });
    }

    // Verify farmer owns the product
    const orderResult = await pool.query(
      `SELECT p.farmer_id FROM orders o
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

    // Update order
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      orderId,
    ]);

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
