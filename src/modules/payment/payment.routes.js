import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createOrderSchema, verifyPaymentSchema, paymentStatusSchema } from "./payment.validation.js";
import { createOrder, verifyPayment, handleWebhook, getPaymentStatus } from "./payment.controller.js";

const router = express.Router();

router.post("/create-order", verifyToken, requireRole("customer"), validate(createOrderSchema), createOrder);
router.post("/verify", verifyToken, requireRole("customer"), validate(verifyPaymentSchema), verifyPayment);
router.get("/status/:paymentId", verifyToken, validate(paymentStatusSchema), getPaymentStatus);

// No auth — Razorpay calls this directly, verified via signature
router.post("/webhook", handleWebhook);

export default router;
