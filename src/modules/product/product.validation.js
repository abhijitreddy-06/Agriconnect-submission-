import { z } from "zod";

export const productQuerySchema = {
  query: z.object({
    farmer_id: z.string().optional(),
    category: z.string().max(50).optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
};

export const idParamSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID."),
  }),
};
