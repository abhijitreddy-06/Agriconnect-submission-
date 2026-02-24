import catchAsync from "../../utils/catchAsync.js";
import * as PaymentService from "./payment.service.js";

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for the current cart contents.
 */
export const createOrder = catchAsync(async (req, res) => {
  const { delivery_address } = req.body;
  const data = await PaymentService.createOrder(req.user.userId, delivery_address);
  return res.status(201).json({ success: true, data });
});

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature and creates orders in DB.
 */
export const verifyPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.verifyAndComplete(req.user.userId, req.body);
  return res.json({
    success: true,
    message: result.alreadyProcessed
      ? "Payment was already processed."
      : `${result.orderIds.length} order(s) placed successfully.`,
    orderIds: result.orderIds,
    warnings: result.warnings,
  });
});

/**
 * POST /api/payment/webhook
 * Handles Razorpay webhook notifications (no auth required).
 */
export const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    return res.status(400).json({ success: false, error: "Missing signature." });
  }

  const result = await PaymentService.handleWebhook(req.body, signature);
  return res.json({ success: true, ...result });
});

/**
 * GET /api/payment/status/:paymentId
 * Fetches payment status from Razorpay.
 */
export const getPaymentStatus = catchAsync(async (req, res) => {
  const data = await PaymentService.getPaymentStatus(req.params.paymentId);
  return res.json({ success: true, data });
});
