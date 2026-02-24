import { z } from "zod";

export const createOrderSchema = {
  body: z.object({
    product_id: z.coerce.number({ required_error: "Product ID is required." })
      .int()
      .positive(),
    quantity: z.coerce.number({ required_error: "Quantity is required." })
      .positive("Quantity must be a positive number."),
    delivery_address: z.string()
      .min(10, "Delivery address must be at least 10 characters.")
      .max(500, "Delivery address must be at most 500 characters.")
      .optional(),
  }),
};

export const updateOrderSchema = {
  body: z.object({
    status: z.enum(["pending", "accepted", "shipped", "delivered"], {
      errorMap: () => ({
        message: "Invalid status. Must be: pending, accepted, shipped, or delivered.",
      }),
    }),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID."),
  }),
};
