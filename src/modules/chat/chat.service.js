import * as ChatModel from "./chat.model.js";
import AppError from "../../utils/AppError.js";

export const getMessages = async (userId, orderId) => {
  const order = await ChatModel.findOrderParticipants(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (userId !== order.customer_id && userId !== order.farmer_id) {
    throw new AppError("You are not part of this order.", 403);
  }
  if (order.status !== "pending") {
    throw new AppError("Chat is only available for pending orders.", 400);
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
