import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/tokenUtils.js";
import pool from "./database.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? process.env.BASE_URL : true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = verifyAccessToken(token);
      socket.user = { userId: decoded.userId, role: decoded.role };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_order", async (orderId) => {
      try {
        const result = await pool.query(
          `SELECT o.id, o.customer_id, o.status, p.farmer_id
           FROM orders o JOIN products p ON o.product_id = p.id
           WHERE o.id = $1`,
          [orderId]
        );

        if (result.rows.length === 0) {
          return socket.emit("chat_error", "Order not found.");
        }

        const order = result.rows[0];
        const userId = socket.user.userId;

        if (userId !== order.customer_id && userId !== order.farmer_id) {
          return socket.emit("chat_error", "You are not part of this order.");
        }

        if (order.status !== "pending") {
          return socket.emit("chat_error", "Chat is only available for pending orders.");
        }

        socket.join(`order_${orderId}`);
        socket.emit("joined", { orderId });
      } catch {
        socket.emit("chat_error", "Failed to join chat.");
      }
    });

    socket.on("send_message", async ({ orderId, message }) => {
      try {
        if (!message || typeof message !== "string") {
          return socket.emit("chat_error", "Message is required.");
        }

        const trimmed = message.trim();
        if (trimmed.length === 0 || trimmed.length > 300) {
          return socket.emit("chat_error", "Message must be 1-300 characters.");
        }

        const userId = socket.user.userId;
        const role = socket.user.role;

        const orderResult = await pool.query(
          `SELECT o.id, o.customer_id, o.status, p.farmer_id
           FROM orders o JOIN products p ON o.product_id = p.id
           WHERE o.id = $1`,
          [orderId]
        );

        if (orderResult.rows.length === 0) {
          return socket.emit("chat_error", "Order not found.");
        }

        const order = orderResult.rows[0];

        if (userId !== order.customer_id && userId !== order.farmer_id) {
          return socket.emit("chat_error", "You are not part of this order.");
        }

        if (order.status !== "pending") {
          return socket.emit("chat_error", "Chat is only available for pending orders.");
        }

        if (role === "customer") {
          const rateCheck = await pool.query(
            `SELECT id FROM chat_messages
             WHERE sender_id = $1 AND order_id = $2 AND created_at > NOW() - INTERVAL '1 hour'
             LIMIT 1`,
            [userId, orderId]
          );

          if (rateCheck.rows.length > 0) {
            return socket.emit("chat_error", "You can only send 1 message per hour. Please wait.");
          }
        }

        const insertResult = await pool.query(
          `INSERT INTO chat_messages (order_id, sender_id, sender_role, message)
           VALUES ($1, $2, $3, $4)
           RETURNING id, order_id, sender_id, sender_role, message, created_at`,
          [orderId, userId, role, trimmed]
        );

        const msg = insertResult.rows[0];
        io.to(`order_${orderId}`).emit("new_message", msg);
      } catch {
        socket.emit("chat_error", "Failed to send message.");
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
};
