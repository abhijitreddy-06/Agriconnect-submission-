import express from "express";
import { predictUpload } from "../middleware/upload.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import {
  analyzeImage,
  getPrediction,
} from "../controllers/predictionController.js";

const router = express.Router();

// Combined upload + analyze in one step (memory storage, no file saved)
router.post("/api/predict/analyze", verifyToken, requireRole("farmer"), predictUpload.single("imageInput"), analyzeImage);
router.get("/api/predict/:id", verifyToken, requireRole("farmer"), getPrediction);

export default router;
