import express from "express";
import upload from "../middleware/upload.js";
import {
  uploadImage,
  analyzeImage,
  getPrediction,
} from "../controllers/predictionController.js";

const router = express.Router();

router.post("/upload", upload.single("imageInput"), uploadImage);
router.post("/analyze", analyzeImage);
router.get("/prediction/:id", getPrediction);

export default router;
