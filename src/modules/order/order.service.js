import * as OrderModel from "./order.model.js";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

export const createOrder = async (customerId, { product_id, quantity, delivery_address }) => {
  const client = await OrderModel.getClient();

  try {
    await client.query("BEGIN");

    const product = await OrderModel.findProductForUpdate(client, product_id);
    if (!product) {
      await client.query("ROLLBACK");
      throw new AppError("Product not found.", 404);
    }
    if (product.farmer_id === customerId) {
      await client.query("ROLLBACK");
      throw new AppError("You cannot order your own product.", 400);
    }
    if (parseFloat(product.stock) < quantity) {
      await client.query("ROLLBACK");
      throw new AppError(`Insufficient stock. Only ${product.stock} available.`, 400);
    }

    const totalPrice = parseFloat(product.price) * quantity;
    const order = await OrderModel.createOrder(client, customerId, product_id, quantity, totalPrice, delivery_address);
    await OrderModel.reduceStock(client, product_id, quantity);

    await client.query("COMMIT");

    await cacheInvalidatePattern("orders:*");
    await cacheInvalidatePattern("products:*");

    return order.id;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

export const getOrders = async (userId, role, query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 15));
  const offset = (page - 1) * limit;

  const cacheKey = `orders:${role}:${userId}:page:${page}:limit:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { rows, total } = await OrderModel.findOrders(role, userId, limit, offset);
  const totalPages = Math.ceil(total / limit);
  const responseData = { data: rows, total, page, limit, totalPages };

  await cacheSet(cacheKey, responseData, 120);
  return responseData;
};

export const getOrderById = async (userId, orderId) => {
  const order = await OrderModel.findOrderById(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.customer_id !== userId && order.farmer_id !== userId) {
    throw new AppError("You do not have permission to view this order.", 403);
  }
  return order;
};

export const cancelOrder = async (customerId, orderId) => {
  const client = await OrderModel.getClient();

  try {
    await client.query("BEGIN");

    const order = await OrderModel.findOrderForCancel(client, orderId);
    if (!order) {
      await client.query("ROLLBACK");
      throw new AppError("Order not found.", 404);
    }
    if (order.customer_id !== customerId) {
      await client.query("ROLLBACK");
      throw new AppError("You can only cancel your own orders.", 403);
    }
    if (!["pending", "accepted"].includes(order.status)) {
      await client.query("ROLLBACK");
      throw new AppError(`Cannot cancel an order that is already "${order.status}".`, 400);
    }

    await OrderModel.updateStatus(orderId, "cancelled", client);
    await OrderModel.restoreStock(client, order.product_id, order.quantity);

    await client.query("COMMIT");

    await cacheInvalidatePattern("orders:*");
    await cacheInvalidatePattern("products:*");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (userId, orderId, status) => {
  const order = await OrderModel.findOrderWithFarmer(orderId);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.farmer_id !== userId) throw new AppError("You do not have permission to update this order.", 403);

  const validTransitions = {
    pending: ["accepted"],
    accepted: ["shipped"],
    shipped: ["delivered"],
  };

  const allowed = validTransitions[order.current_status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(`Cannot transition from '${order.current_status}' to '${status}'.`, 400);
  }

  await OrderModel.updateStatus(orderId, status);
  await cacheInvalidatePattern("orders:*");
};
