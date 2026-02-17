import express from "express";
import upload from "../middleware/upload.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import {
  uploadImage,
  analyzeImage,
  getPrediction,
} from "../controllers/predictionController.js";

const router = express.Router();

// All prediction routes require farmer auth
router.post("/upload", verifyToken, requireRole("farmer"), upload.single("imageInput"), uploadImage);
router.post("/analyze", verifyToken, requireRole("farmer"), analyzeImage);
router.get("/prediction/:id", verifyToken, requireRole("farmer"), getPrediction);

export default router;
