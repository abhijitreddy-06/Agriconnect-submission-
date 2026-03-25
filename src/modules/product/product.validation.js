import { z } from "zod";

export const productQuerySchema = {
  query: z.object({
    farmer_id: z.string().optional(),
    category: z.string().max(50).optional(),
    search: z.string().max(100).optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    min_rating: z.coerce.number().min(0).max(5).optional(),
    organic: z.enum(["true", "false"]).optional(),
    eco: z.enum(["true", "false"]).optional(),
    max_distance: z.coerce.number().positive().optional(),
    user_lat: z.coerce.number().optional(),
    user_lng: z.coerce.number().optional(),
    seasonal: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID."),
  }),
};
