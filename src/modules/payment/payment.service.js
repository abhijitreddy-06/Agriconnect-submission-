import Razorpay from "razorpay";
import crypto from "crypto";
import * as PaymentModel from "./payment.model.js";
import { cacheInvalidatePattern } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isTestMode = () => (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");

/**
 * Step 1: Create a Razorpay order from the current cart contents.
 * Validates stock but does NOT deduct it yet (that happens after payment verification).
 */
export const createOrder = async (customerId, deliveryAddress) => {
  const cartItems = await PaymentModel.findCartItemsForPayment(customerId);
  if (cartItems.length === 0) throw new AppError("Cart is empty.", 400);

  let totalAmount = 0;
  const validItems = [];

  for (const item of cartItems) {
    if (item.farmer_id === customerId) {
      throw new AppError(`You cannot purchase your own product "${item.product_name}".`, 400);
    }
    if (parseFloat(item.stock) < parseFloat(item.quantity)) {
      throw new AppError(
        `"${item.product_name}" only has ${item.stock} in stock (you requested ${item.quantity}).`,
        400
      );
    }
    const subtotal = parseFloat(item.price) * parseFloat(item.quantity);
    totalAmount += subtotal;
    validItems.push(item);
  }

  // Razorpay expects amount in paise (smallest currency unit)
  const amountInPaise = Math.round(totalAmount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `cart_${customerId}_${Date.now()}`,
    notes: {
      customer_id: String(customerId),
      delivery_address: deliveryAddress || "",
      item_count: String(validItems.length),
    },
  });

  return {
    razorpay_order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: "INR",
    key_id: process.env.RAZORPAY_KEY_ID,
    item_count: validItems.length,
    total: totalAmount,
    test_mode: isTestMode(),
  };
};

/**
 * Step 2: Verify payment signature and create orders in the database.
 * This is called after Razorpay checkout succeeds on the frontend.
 */
export const verifyAndComplete = async (customerId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, delivery_address }) => {
  // 1. Verify signature using HMAC SHA256
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new AppError("Payment verification failed. Invalid signature.", 400);
  }

  // 2. Fetch payment from Razorpay to confirm status
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  // Accept both "captured" and "authorized" (test mode may use either)
  const validStatuses = ["captured", "authorized"];
  if (!validStatuses.includes(payment.status)) {
    throw new AppError(`Payment not successful. Status: ${payment.status}.`, 400);
  }

  // 3. Check if this order was already processed (idempotency)
  const existingOrders = await PaymentModel.findOrdersByRazorpayOrderId(razorpay_order_id);
  if (existingOrders.length > 0) {
    return {
      orderIds: existingOrders.map((o) => o.id),
      message: "Payment already processed.",
      alreadyProcessed: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        method: payment.method,
        status: payment.status,
      },
    };
  }

  // 4. Create orders in a transaction
  const client = await PaymentModel.getClient();

  try {
    await client.query("BEGIN");

    const cartItems = await PaymentModel.findCartItemsForCheckout(client, customerId);
    if (cartItems.length === 0) {
      await client.query("ROLLBACK");
      throw new AppError("Cart is empty. Items may have been removed.", 400);
    }

    const errors = [];
    const orderIds = [];

    for (const item of cartItems) {
      if (parseFloat(item.stock) < parseFloat(item.quantity)) {
        errors.push(`"${item.product_name}" only has ${item.stock} in stock.`);
        continue;
      }

      const totalPrice = parseFloat(item.price) * parseFloat(item.quantity);
      const order = await PaymentModel.createOrder(
        client,
        customerId,
        item.product_id,
        item.quantity,
        totalPrice,
        delivery_address,
        razorpay_order_id,
        razorpay_payment_id
      );
      orderIds.push(order.id);
      await PaymentModel.reduceStock(client, item.product_id, item.quantity);
    }

    if (errors.length > 0 && orderIds.length === 0) {
      await client.query("ROLLBACK");
      throw new AppError("Stock unavailable for all items: " + errors.join(" "), 400);
    }

    await PaymentModel.clearCartForUser(client, customerId);
    await client.query("COMMIT");

    await cacheInvalidatePattern(`cart:${customerId}*`);
    await cacheInvalidatePattern("orders:*");
    await cacheInvalidatePattern("products:*");

    return {
      orderIds,
      warnings: errors.length > 0 ? errors : undefined,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        method: payment.method,
        status: payment.status,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Handle Razorpay webhook events for payment status updates.
 */
export const handleWebhook = async (body, signature) => {
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new AppError("Invalid webhook signature.", 400);
  }

  const event = body.event;
  const paymentEntity = body.payload?.payment?.entity;

  if (!paymentEntity) return { status: "ignored", event };

  const razorpayOrderId = paymentEntity.order_id;

  switch (event) {
    case "payment.captured":
      await PaymentModel.updatePaymentStatus(razorpayOrderId, "paid", paymentEntity.id);
      break;

    case "payment.failed":
      await PaymentModel.updatePaymentStatus(razorpayOrderId, "failed", paymentEntity.id);
      await cacheInvalidatePattern("orders:*");
      break;

    case "payment.authorized":
      await PaymentModel.updatePaymentStatus(razorpayOrderId, "paid", paymentEntity.id);
      break;

    default:
      return { status: "ignored", event };
  }

  return { status: "processed", event };
};

/**
 * Fetch payment status from Razorpay for a given payment ID.
 */
export const getPaymentStatus = async (paymentId) => {
  const payment = await razorpay.payments.fetch(paymentId);
  return {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount / 100,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    description: payment.description,
    error_code: payment.error_code || null,
    error_description: payment.error_description || null,
    created_at: payment.created_at,
    test_mode: isTestMode(),
  };
};
