import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createFarmerReviewSchema, farmerIdParamSchema } from "./farmerReview.validation.js";
import { createFarmerReview, getFarmerReviews } from "./farmerReview.controller.js";

const router = express.Router();

router.get("/farmer/:farmerId", validate(farmerIdParamSchema), getFarmerReviews);
router.post("/", verifyToken, requireRole("customer"), validate(createFarmerReviewSchema), createFarmerReview);

export default router;
