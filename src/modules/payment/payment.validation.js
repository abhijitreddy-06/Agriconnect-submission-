import { z } from "zod";

export const createOrderSchema = {
  body: z.object({
    delivery_address: z.string()
      .min(10, "Delivery address must be at least 10 characters.")
      .max(500, "Delivery address must be at most 500 characters.")
      .optional(),
  }),
};

export const verifyPaymentSchema = {
  body: z.object({
    razorpay_order_id: z.string().min(1, "Razorpay order ID is required."),
    razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required."),
    razorpay_signature: z.string().min(1, "Razorpay signature is required."),
    delivery_address: z.string()
      .min(10, "Delivery address must be at least 10 characters.")
      .max(500, "Delivery address must be at most 500 characters.")
      .optional(),
  }),
};

export const paymentStatusSchema = {
  params: z.object({
    paymentId: z.string().min(1, "Payment ID is required."),
  }),
};
