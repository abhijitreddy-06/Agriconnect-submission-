import { Server } from "socket.io";
import {
  authenticateSocketUser,
  validateOrderChatAccess,
  ensureMessageAllowed,
  saveMessage,
} from "../modules/chat/chat.socket.service.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? process.env.BASE_URL : true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      socket.user = authenticateSocketUser(token);
      next();
    } catch (error) {
      next(new Error(error.message || "Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_order", async (orderId) => {
      try {
        const access = await validateOrderChatAccess(socket.user.userId, orderId);
        socket.join(`order_${access.parsedOrderId}`);
        socket.emit("joined", { orderId: access.parsedOrderId });
      } catch (error) {
        socket.emit("chat_error", error.message || "Failed to join chat.");
      }
    });

    socket.on("send_message", async ({ orderId, message }) => {
      try {
        const userId = socket.user.userId;
        const role = socket.user.role;

        const access = await validateOrderChatAccess(userId, orderId);
        const trimmedMessage = await ensureMessageAllowed(
          userId,
          role,
          access.parsedOrderId,
          message
        );

        const saved = await saveMessage(
          access.parsedOrderId,
          userId,
          role,
          trimmedMessage
        );

        io.to(`order_${access.parsedOrderId}`).emit("new_message", saved);
      } catch (error) {
        socket.emit("chat_error", error.message || "Failed to send message.");
      }
    });
  });

  return io;
};
