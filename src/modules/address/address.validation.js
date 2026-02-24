import { z } from "zod";

export const createAddressSchema = {
  body: z.object({
    label: z.string().max(50).optional().default("Home"),
    full_name: z.string({ required_error: "Full name is required." })
      .trim()
      .min(1, "Full name is required.")
      .max(100, "Full name must be at most 100 characters."),
    phone: z.string({ required_error: "Phone number is required." })
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
    address_line1: z.string({ required_error: "Address line 1 is required." })
      .trim()
      .min(5, "Address line 1 must be at least 5 characters.")
      .max(255, "Address line 1 must be at most 255 characters."),
    address_line2: z.string().max(255).optional().nullable(),
    city: z.string({ required_error: "City is required." })
      .trim()
      .min(1, "City is required.")
      .max(100, "City must be at most 100 characters."),
    state: z.string({ required_error: "State is required." })
      .trim()
      .min(1, "State is required.")
      .max(100, "State must be at most 100 characters."),
    pincode: z.string({ required_error: "Pincode is required." })
      .regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),
    is_default: z.boolean().optional().default(false),
  }),
};

export const updateAddressSchema = {
  body: z.object({
    label: z.string().max(50).optional(),
    full_name: z.string()
      .trim()
      .min(1, "Full name is required.")
      .max(100, "Full name must be at most 100 characters.")
      .optional(),
    phone: z.string()
      .regex(/^\d{10}$/, "Phone number must be exactly 10 digits.")
      .optional(),
    address_line1: z.string()
      .trim()
      .min(5, "Address line 1 must be at least 5 characters.")
      .max(255, "Address line 1 must be at most 255 characters.")
      .optional(),
    address_line2: z.string().max(255).optional().nullable(),
    city: z.string()
      .trim()
      .min(1, "City is required.")
      .max(100, "City must be at most 100 characters.")
      .optional(),
    state: z.string()
      .trim()
      .min(1, "State is required.")
      .max(100, "State must be at most 100 characters.")
      .optional(),
    pincode: z.string()
      .regex(/^\d{6}$/, "Pincode must be exactly 6 digits.")
      .optional(),
    is_default: z.boolean().optional(),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID."),
  }),
};
