import catchAsync from "../../utils/catchAsync.js";
import * as OrderService from "./order.service.js";

export const createOrder = catchAsync(async (req, res) => {
  const orderId = await OrderService.createOrder(req.user.userId, req.body);
  return res.status(201).json({ success: true, orderId, message: "Order created successfully." });
});

export const getOrders = catchAsync(async (req, res) => {
  const data = await OrderService.getOrders(req.user.userId, req.user.role, req.query);
  return res.json({ success: true, ...data });
});

export const getOrderById = catchAsync(async (req, res) => {
  const data = await OrderService.getOrderById(req.user.userId, req.params.id);
  return res.json({ success: true, data });
});

export const cancelOrder = catchAsync(async (req, res) => {
  await OrderService.cancelOrder(req.user.userId, req.params.id);
  return res.json({ success: true, message: "Order cancelled successfully. Stock has been restored." });
});

export const updateOrder = catchAsync(async (req, res) => {
  await OrderService.updateOrderStatus(req.user.userId, req.params.id, req.body.status);
  return res.json({ success: true, message: "Order updated successfully." });
});
