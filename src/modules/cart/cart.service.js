import * as CartModel from "./cart.model.js";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

export const addToCart = async (customerId, { product_id, quantity }) => {
  const product = await CartModel.findProduct(product_id);
  if (!product) throw new AppError("Product not found.", 404);
  if (product.farmer_id === customerId) throw new AppError("You cannot add your own product to cart.", 400);

  const cartItem = await CartModel.upsertCartItem(customerId, product_id, quantity);
  await cacheInvalidatePattern(`cart:${customerId}*`);
  return cartItem;
};

export const getCart = async (customerId) => {
  const cacheKey = `cart:${customerId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const rows = await CartModel.findCartItems(customerId);
  const items = rows.map((item) => ({
    ...item,
    subtotal: parseFloat(item.price) * parseFloat(item.quantity),
  }));

  const cartTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const cartData = { items, cartTotal, itemCount: items.length };

  await cacheSet(cacheKey, cartData, 60);
  return cartData;
};

export const updateCartItem = async (customerId, cartItemId, quantity) => {
  const item = await CartModel.findCartItem(cartItemId, customerId);
  if (!item) throw new AppError("Cart item not found.", 404);

  await CartModel.updateQuantity(cartItemId, quantity);
  await cacheInvalidatePattern(`cart:${customerId}*`);
};

export const removeCartItem = async (customerId, cartItemId) => {
  const result = await CartModel.removeItem(cartItemId, customerId);
  if (!result) throw new AppError("Cart item not found.", 404);
  await cacheInvalidatePattern(`cart:${customerId}*`);
};

export const clearCart = async (customerId) => {
  await CartModel.clearAll(customerId);
  await cacheInvalidatePattern(`cart:${customerId}*`);
};

export const checkout = async (customerId, deliveryAddress) => {
  const client = await CartModel.getClient();

  try {
    await client.query("BEGIN");

    const cartItems = await CartModel.findCartItemsForCheckout(client, customerId);
    if (cartItems.length === 0) {
      await client.query("ROLLBACK");
      throw new AppError("Cart is empty.", 400);
    }

    const errors = [];
    const orderIds = [];

    for (const item of cartItems) {
      if (parseFloat(item.stock) < parseFloat(item.quantity)) {
        errors.push(`"${item.product_name}" only has ${item.stock} in stock (you requested ${item.quantity}).`);
        continue;
      }

      const totalPrice = parseFloat(item.price) * parseFloat(item.quantity);
      const order = await CartModel.createOrder(client, customerId, item.product_id, item.quantity, totalPrice, deliveryAddress);
      orderIds.push(order.id);
      await CartModel.reduceStock(client, item.product_id, item.quantity);
    }

    if (errors.length > 0 && orderIds.length === 0) {
      await client.query("ROLLBACK");
      throw new AppError(errors.join(" "), 400);
    }

    await CartModel.clearCartForUser(client, customerId);
    await client.query("COMMIT");

    await cacheInvalidatePattern(`cart:${customerId}*`);
    await cacheInvalidatePattern("orders:*");
    await cacheInvalidatePattern("products:*");

    return { orderIds, warnings: errors.length > 0 ? errors : undefined };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};
