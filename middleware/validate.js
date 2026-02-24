import { z } from "zod";

/**
 * Express middleware factory for Zod schema validation.
 * Validates req.body, req.query, or req.params against a Zod schema.
 *
 * @param {Object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
export const validate = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...result.error.issues.map((i) => i.message));
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...result.error.issues.map((i) => i.message));
      } else {
        req.query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...result.error.issues.map((i) => i.message));
      } else {
        req.params = result.data;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors[0] });
    }

    next();
  };
};

// ─── Auth Schemas ───────────────────────────────────────────────

export const signupSchema = {
  body: z.object({
    username: z.string({ required_error: "Username is required." })
      .trim()
      .min(1, "Username is required.")
      .max(50, "Username must be at most 50 characters."),
    phone: z.string({ required_error: "Phone number is required." })
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
    password: z.string({ required_error: "Password is required." })
      .min(8, "Password must be at least 8 characters."),
    role: z.enum(["farmer", "customer"], {
      errorMap: () => ({ message: "Role must be 'farmer' or 'customer'." }),
    }),
  }),
};

export const loginSchema = {
  body: z.object({
    phone: z.string({ required_error: "Phone number is required." })
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
    password: z.string({ required_error: "Password is required." })
      .min(1, "Password is required."),
    role: z.enum(["farmer", "customer"], {
      errorMap: () => ({ message: "Role must be 'farmer' or 'customer'." }),
    }),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string({ required_error: "Refresh token is required." })
      .min(1, "Refresh token is required."),
  }),
};

export const updateProfileSchema = {
  body: z.object({
    username: z.string({ required_error: "Username is required." })
      .trim()
      .min(2, "Username must be between 2 and 50 characters.")
      .max(50, "Username must be between 2 and 50 characters."),
  }),
};

// ─── Product Schemas ────────────────────────────────────────────

export const createProductSchema = {
  body: z.object({
    product_name: z.string({ required_error: "Product name is required." })
      .trim()
      .min(1, "Product name is required.")
      .max(200, "Product name must be at most 200 characters."),
    price: z.coerce.number({ invalid_type_error: "Price must be a valid number." })
      .min(0, "Price must be a positive number.")
      .max(20000, "Maximum allowed price is 20000."),
    quantity: z.coerce.number({ invalid_type_error: "Quantity must be a valid number." })
      .min(0, "Quantity must be a positive number.")
      .max(2000, "Maximum allowed quantity is 2000."),
    quality: z.string().optional().default(""),
    description: z.string().max(2000).optional().default(""),
    quantity_unit: z.string().max(20).optional().default(""),
    category: z.string().max(50).optional().default(""),
  }),
};

export const productQuerySchema = {
  query: z.object({
    farmer_id: z.string().optional(),
    category: z.string().max(50).optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
};

// ─── Cart Schemas ───────────────────────────────────────────────

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

// ─── Order Schemas ──────────────────────────────────────────────

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

export const checkoutSchema = {
  body: z.object({
    delivery_address: z.string()
      .min(10, "Delivery address must be at least 10 characters.")
      .max(500, "Delivery address must be at most 500 characters.")
      .optional(),
  }),
};

// ─── Review Schemas ────────────────────────────────────────────

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

// ─── Common Param Schemas ───────────────────────────────────────

export const idParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID."),
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
