import { z } from "zod";

export const toggleWishlistSchema = {
  body: z.object({
    product_id: z.coerce.number().int().positive("Invalid product id."),
  }),
};
