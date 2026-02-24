import { z } from "zod";

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
    delivery_address: z.string()
      .min(10, "Delivery address must be at least 10 characters.")
      .max(500, "Delivery address must be at most 500 characters.")
      .optional()
      .nullable(),
  }),
};
