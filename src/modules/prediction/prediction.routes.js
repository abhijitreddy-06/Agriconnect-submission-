import express from "express";
import { predictUpload } from "../../middleware/upload.js";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { analyzeImage, getPrediction } from "./prediction.controller.js";

const router = express.Router();

router.post("/analyze", verifyToken, requireRole("farmer"), predictUpload.single("imageInput"), analyzeImage);
router.get("/:id", verifyToken, requireRole("farmer"), getPrediction);

export default router;
