import { z } from "zod";

export const createFarmerReviewSchema = {
  body: z.object({
    order_id: z.coerce.number().int().positive("Invalid order id."),
    reliability_rating: z.coerce.number().int().min(1).max(5),
    quality_rating: z.coerce.number().int().min(1).max(5),
    feedback: z.string().max(600).optional(),
  }),
};

export const farmerIdParamSchema = {
  params: z.object({
    farmerId: z.coerce.number().int().positive("Invalid farmer id."),
  }),
};
