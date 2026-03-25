import catchAsync from "../../utils/catchAsync.js";
import * as CartService from "./cart.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const addToCart = catchAsync(async (req, res) => {
  const cartItem = await CartService.addToCart(req.user.userId, req.body);
  return sendResponse(res, 201, "Added to cart.", { cartItem });
});

export const getCart = catchAsync(async (req, res) => {
  const data = await CartService.getCart(req.user.userId);
  return sendResponse(res, 200, "Cart fetched successfully.", data);
});

export const updateCartItem = catchAsync(async (req, res) => {
  await CartService.updateCartItem(req.user.userId, req.params.id, req.body.quantity);
  return sendResponse(res, 200, "Cart updated.", null);
});

export const removeCartItem = catchAsync(async (req, res) => {
  await CartService.removeCartItem(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Item removed from cart.", null);
});

export const clearCart = catchAsync(async (req, res) => {
  await CartService.clearCart(req.user.userId);
  return sendResponse(res, 200, "Cart cleared.", null);
});

export const checkout = catchAsync(async (req, res) => {
  const { delivery_address } = req.body || {};
  const result = await CartService.checkout(req.user.userId, delivery_address);
  return sendResponse(res, 201, `${result.orderIds.length} order(s) placed successfully.`, {
    orderIds: result.orderIds,
    warnings: result.warnings || null,
  });
});
