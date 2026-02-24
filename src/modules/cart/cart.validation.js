import { z } from "zod";

export const addToCartSchema = {
  body: z.object({
    product_id: z.coerce.number({ required_error: "Product ID is required." })
      .int("Product ID must be an integer.")
      .positive("Product ID must be positive."),
    quantity: z.coerce.number().positive("Quantity must be positive.")
      .max(9999, "Quantity must be at most 9999.")
      .optional()
      .default(1),
  }),
};

export const updateCartSchema = {
  body: z.object({
    quantity: z.coerce.number({ required_error: "Quantity is required." })
      .positive("Quantity must be positive.")
      .max(9999, "Quantity must be at most 9999."),
  }),
};

export const checkoutSchema = {
  body: z.object({
    delivery_address: z.string()
      .min(10, "Delivery address must be at least 10 characters.")
      .max(500, "Delivery address must be at most 500 characters.")
      .optional(),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID."),
  }),
};
