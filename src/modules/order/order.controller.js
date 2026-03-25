import catchAsync from "../../utils/catchAsync.js";
import * as OrderService from "./order.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const createOrder = catchAsync(async (req, res) => {
  const orderId = await OrderService.createOrder(req.user.userId, req.body);
  return sendResponse(res, 201, "Order created successfully.", { orderId });
});

export const getOrders = catchAsync(async (req, res) => {
  const data = await OrderService.getOrders(req.user.userId, req.user.role, req.query);
  return sendResponse(res, 200, "Orders fetched successfully.", data);
});

export const getOrderById = catchAsync(async (req, res) => {
  const data = await OrderService.getOrderById(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Order fetched successfully.", data);
});

export const cancelOrder = catchAsync(async (req, res) => {
  await OrderService.cancelOrder(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Order cancelled successfully. Stock has been restored.", null);
});

export const updateOrder = catchAsync(async (req, res) => {
  await OrderService.updateOrderStatus(req.user.userId, req.params.id, req.body.status);
  return sendResponse(res, 200, "Order updated successfully.", null);
});
