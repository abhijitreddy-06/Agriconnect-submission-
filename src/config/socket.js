import { Server } from "socket.io";
import {
  authenticateSocketUser,
  validateOrderChatAccess,
  ensureMessageAllowed,
  saveMessage,
} from "../modules/chat/chat.socket.service.js";

const parseAllowedOrigins = () => {
  const configured = [
    process.env.CORS_ORIGINS,
    process.env.FRONTEND_URL,
    process.env.BASE_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return Array.from(new Set(configured));
};

const allowedOrigins = parseAllowedOrigins();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV !== "production") return callback(null, true);

        const normalizedOrigin = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = {
        accessToken: socket.handshake.auth?.token,
        cookieHeader: socket.handshake.headers?.cookie,
      };
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

    socket.on("typing_start", async ({ orderId }) => {
      try {
        const access = await validateOrderChatAccess(socket.user.userId, orderId);
        socket.to(`order_${access.parsedOrderId}`).emit("typing", {
          orderId: access.parsedOrderId,
          userId: socket.user.userId,
          role: socket.user.role,
          active: true,
        });
      } catch {}
    });

    socket.on("typing_stop", async ({ orderId }) => {
      try {
        const access = await validateOrderChatAccess(socket.user.userId, orderId);
        socket.to(`order_${access.parsedOrderId}`).emit("typing", {
          orderId: access.parsedOrderId,
          userId: socket.user.userId,
          role: socket.user.role,
          active: false,
        });
      } catch {}
    });
  });

  return io;
};
