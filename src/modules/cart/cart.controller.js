import catchAsync from "../../utils/catchAsync.js";
import * as CartService from "./cart.service.js";

export const addToCart = catchAsync(async (req, res) => {
  const cartItem = await CartService.addToCart(req.user.userId, req.body);
  return res.status(201).json({ success: true, message: "Added to cart.", cartItem });
});

export const getCart = catchAsync(async (req, res) => {
  const data = await CartService.getCart(req.user.userId);
  return res.json({ success: true, data });
});

export const updateCartItem = catchAsync(async (req, res) => {
  await CartService.updateCartItem(req.user.userId, req.params.id, req.body.quantity);
  return res.json({ success: true, message: "Cart updated." });
});

export const removeCartItem = catchAsync(async (req, res) => {
  await CartService.removeCartItem(req.user.userId, req.params.id);
  return res.json({ success: true, message: "Item removed from cart." });
});

export const clearCart = catchAsync(async (req, res) => {
  await CartService.clearCart(req.user.userId);
  return res.json({ success: true, message: "Cart cleared." });
});

export const checkout = catchAsync(async (req, res) => {
  const { delivery_address } = req.body || {};
  const result = await CartService.checkout(req.user.userId, delivery_address);
  return res.status(201).json({
    success: true,
    message: `${result.orderIds.length} order(s) placed successfully.`,
    orderIds: result.orderIds,
    warnings: result.warnings,
  });
});
