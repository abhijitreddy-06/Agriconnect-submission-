import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createReviewSchema, productIdParamSchema, orderIdParamSchema } from "./review.validation.js";
import { createReview, getProductReviews, checkReview } from "./review.controller.js";

const router = express.Router();

router.post("/", verifyToken, requireRole("customer"), validate(createReviewSchema), createReview);
router.get("/product/:productId", validate(productIdParamSchema), getProductReviews);
router.get("/check/:orderId", verifyToken, requireRole("customer"), validate(orderIdParamSchema), checkReview);

export default router;
