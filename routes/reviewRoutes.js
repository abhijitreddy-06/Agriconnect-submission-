import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate, createReviewSchema, productIdParamSchema, orderIdParamSchema } from "../middleware/validate.js";
import { createReview, getProductReviews, checkReview } from "../controllers/reviewController.js";

const router = express.Router();

// Customer: Submit a review
router.post("/api/reviews", verifyToken, requireRole("customer"), validate(createReviewSchema), createReview);

// Public: Get reviews for a product
router.get("/api/reviews/product/:productId", validate(productIdParamSchema), getProductReviews);

// Customer: Check if order is reviewed
router.get("/api/reviews/check/:orderId", verifyToken, requireRole("customer"), validate(orderIdParamSchema), checkReview);

export default router;
