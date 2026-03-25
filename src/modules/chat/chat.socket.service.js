import pool from "../../config/database.js";
import { verifyAccessToken } from "../../utils/tokenUtils.js";
import AppError from "../../utils/AppError.js";

const parseOrderId = (orderId) => {
  const parsed = Number(orderId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("Invalid order ID.", 400);
  }
  return parsed;
};

export const authenticateSocketUser = (token) => {
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};

export const validateOrderChatAccess = async (userId, orderId) => {
  const parsedOrderId = parseOrderId(orderId);

  const result = await pool.query(
    `SELECT o.id, o.customer_id, o.status, p.farmer_id
     FROM orders o JOIN products p ON o.product_id = p.id
     WHERE o.id = $1`,
    [parsedOrderId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Order not found.", 404);
  }

  const order = result.rows[0];

  if (userId !== order.customer_id && userId !== order.farmer_id) {
    throw new AppError("You are not part of this order.", 403);
  }

  if (order.status !== "pending") {
    throw new AppError("Chat is only available for pending orders.", 400);
  }

  return { order, parsedOrderId };
};

export const ensureMessageAllowed = async (userId, role, parsedOrderId, message) => {
  if (!message || typeof message !== "string") {
    throw new AppError("Message is required.", 400);
  }

  const trimmed = message.trim();
  if (trimmed.length === 0 || trimmed.length > 300) {
    throw new AppError("Message must be 1-300 characters.", 400);
  }

  if (role === "customer") {
    const rateCheck = await pool.query(
      `SELECT id FROM chat_messages
       WHERE sender_id = $1 AND order_id = $2 AND created_at > NOW() - INTERVAL '1 hour'
       LIMIT 1`,
      [userId, parsedOrderId]
    );

    if (rateCheck.rows.length > 0) {
      throw new AppError("You can only send 1 message per hour. Please wait.", 429);
    }
  }

  return trimmed;
};

export const saveMessage = async (orderId, senderId, senderRole, message) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (order_id, sender_id, sender_role, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, order_id, sender_id, sender_role, message, created_at`,
    [orderId, senderId, senderRole, message]
  );

  return result.rows[0];
};
