import { z } from "zod";

export const createReviewSchema = {
  body: z.object({
    order_id: z.coerce.number({ required_error: "Order ID is required." })
      .int()
      .positive(),
    rating: z.coerce.number({ required_error: "Rating is required." })
      .int("Rating must be a whole number.")
      .min(1, "Rating must be between 1 and 5.")
      .max(5, "Rating must be between 1 and 5."),
    feedback: z.string()
      .max(500, "Feedback must be at most 500 characters.")
      .optional(),
  }),
};

export const productIdParamSchema = {
  params: z.object({
    productId: z.coerce.number().int().positive("Invalid product ID."),
  }),
};

export const orderIdParamSchema = {
  params: z.object({
    orderId: z.coerce.number().int().positive("Invalid order ID."),
  }),
};
