import pool from "../config/database.js";

// GET /api/chat/:orderId - Get chat messages for an order
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.orderId;

    // Verify user is part of this order
    const orderResult = await pool.query(
      `SELECT o.id, o.customer_id, o.status, p.farmer_id
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const order = orderResult.rows[0];

    if (userId !== order.customer_id && userId !== order.farmer_id) {
      return res.status(403).json({ success: false, error: "You are not part of this order." });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ success: false, error: "Chat is only available for pending orders." });
    }

    // Fetch messages (hide phone numbers by not joining user phone)
    const messages = await pool.query(
      `SELECT cm.id, cm.order_id, cm.sender_id, cm.sender_role, cm.message, cm.created_at,
              u.username AS sender_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.order_id = $1
       ORDER BY cm.created_at ASC`,
      [orderId]
    );

    return res.json({ success: true, data: messages.rows });
  } catch (error) {
    console.error("Error fetching chat messages:", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch messages." });
  }
};

// GET /api/chat/:orderId/info - Get chat partner info (without phone)
export const getChatInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.orderId;

    const orderResult = await pool.query(
      `SELECT o.id, o.customer_id, o.status, p.farmer_id, p.product_name,
              uc.username AS customer_name, uf.username AS farmer_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users uc ON o.customer_id = uc.id
       JOIN users uf ON p.farmer_id = uf.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const order = orderResult.rows[0];

    if (userId !== order.customer_id && userId !== order.farmer_id) {
      return res.status(403).json({ success: false, error: "You are not part of this order." });
    }

    // Return info without phone numbers
    return res.json({
      success: true,
      data: {
        orderId: order.id,
        productName: order.product_name,
        status: order.status,
        customerName: order.customer_name,
        farmerName: order.farmer_name,
        partnerId: userId === order.customer_id ? order.farmer_id : order.customer_id,
        partnerName: userId === order.customer_id ? order.farmer_name : order.customer_name,
        partnerRole: userId === order.customer_id ? "farmer" : "customer",
      },
    });
  } catch (error) {
    console.error("Error fetching chat info:", error.message);
    return res.status(500).json({ success: false, error: "Failed to fetch chat info." });
  }
};
