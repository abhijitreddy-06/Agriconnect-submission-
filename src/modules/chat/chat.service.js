import * as ChatModel from "./chat.model.js";
import AppError from "../../utils/AppError.js";

const parseOrderId = (orderId) => {
  const parsed = Number(orderId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("Invalid order id.", 400);
  }
  return parsed;
};

const validateMessage = (message) => {
  if (typeof message !== "string") {
    throw new AppError("Message is required.", 400);
  }

  const trimmed = message.trim();
  if (trimmed.length < 1 || trimmed.length > 300) {
    throw new AppError("Message must be between 1 and 300 characters.", 400);
  }

  return trimmed;
};

export const getMessages = async (userId, orderId) => {
  const order = await ChatModel.findOrderParticipants(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (userId !== order.customer_id && userId !== order.farmer_id) {
    throw new AppError("You are not part of this order.", 403);
  }
  if (order.status === "cancelled") {
    throw new AppError("Chat is unavailable for cancelled orders.", 400);
  }

  return await ChatModel.findMessages(orderId);
};

export const getChatInfo = async (userId, orderId) => {
  const order = await ChatModel.findChatInfo(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (userId !== order.customer_id && userId !== order.farmer_id) {
    throw new AppError("You are not part of this order.", 403);
  }

  return {
    orderId: order.id,
    productName: order.product_name,
    status: order.status,
    customerName: order.customer_name,
    farmerName: order.farmer_name,
    partnerId: userId === order.customer_id ? order.farmer_id : order.customer_id,
    partnerName: userId === order.customer_id ? order.farmer_name : order.customer_name,
    partnerRole: userId === order.customer_id ? "farmer" : "customer",
  };
};

export const sendMessage = async (userId, role, orderId, message) => {
  const parsedOrderId = parseOrderId(orderId);
  const trimmedMessage = validateMessage(message);

  const order = await ChatModel.findOrderParticipants(parsedOrderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (userId !== order.customer_id && userId !== order.farmer_id) {
    throw new AppError("You are not part of this order.", 403);
  }
  if (order.status === "cancelled") {
    throw new AppError("Chat is unavailable for cancelled orders.", 400);
  }

  return ChatModel.createMessage(parsedOrderId, userId, role, trimmedMessage);
};
