import axios from "axios";
import FormData from "form-data";
import pool from "../config/database.js";
import { cacheGet, cacheSet } from "../config/redis.js";

const HF_API_URL = process.env.HF_API_URL || "https://ajay123naik-plant-disease-api.hf.space/predict";

/**
 * POST /api/predict/analyze
 * Accepts image via memory storage, forwards to Hugging Face plant disease model,
 * saves result to DB.
 */
export const analyzeImage = async (req, res) => {
  let predictionId = null;
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image uploaded." });
    }

    // Description and language are optional (kept for backward compat)
    const desc = req.body.description || "";
    const lang = req.body.language || "en";

    // Create prediction record
    const insertResult = await pool.query(
      "INSERT INTO predictions (farmer_id, image_path, description, language, status) VALUES ($1, $2, $3, $4, 'analyzing') RETURNING id",
      [userId, "", desc, lang]
    );
    predictionId = insertResult.rows[0].id;

    // Call HF API with retry
    const hfResult = await callHFWithRetry(req.file);

    // Build structured result from HF response
    const diagnosisResult = JSON.stringify({
      disease: hfResult.prediction || hfResult.class || hfResult.label || "Unknown",
      confidence: hfResult.confidence || hfResult.score || null,
      raw: hfResult,
    });

    // Save analysis result to DB (reusing gemini_details column to avoid migration)
    await pool.query(
      "UPDATE predictions SET gemini_details = $1, status = $2 WHERE id = $3",
      [diagnosisResult, "complete", predictionId]
    );

    const parsed = JSON.parse(diagnosisResult);
    res.json({
      success: true,
      predictionId,
      data: {
        diagnosis: parsed.disease,
        confidence: parsed.confidence,
        details: diagnosisResult,
      },
    });
  } catch (error) {
    // Mark prediction as failed
    if (predictionId) {
      await pool
        .query("UPDATE predictions SET status = $1 WHERE id = $2", ["failed", predictionId])
        .catch(() => {});
    }

    console.error("Error in /api/predict/analyze:", error.message);
    if (error.response) {
      console.error("HF API status:", error.response.status);
      console.error("HF API data:", JSON.stringify(error.response.data).slice(0, 500));
    }
    res.status(500).json({ success: false, error: "Analysis failed. Please try again." });
  }
};

/**
 * Call HF API with one retry on timeout/503 (handles cold starts on free tier).
 */
async function callHFWithRetry(file, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", file.buffer, {
        filename: file.originalname || "plant.jpg",
        contentType: file.mimetype || "image/jpeg",
      });

      const response = await axios.post(HF_API_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 120000, // 2 minutes for cold starts
      });

      console.log("HF API response:", JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      const isRetryable =
        err.code === "ECONNABORTED" ||
        err.code === "ETIMEDOUT" ||
        (err.response && (err.response.status === 503 || err.response.status === 502));

      if (attempt < retries && isRetryable) {
        console.log(`HF API attempt ${attempt + 1} failed (${err.message}), retrying in 5s...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw err;
    }
  }
}

export const getPrediction = async (req, res) => {
  try {
    const predictionId = req.params.id;

    // Check Redis cache for completed predictions
    const cacheKey = `prediction:${predictionId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      let diagnosis = cached.gemini_details;
      let confidence = null;
      try {
        const parsed = JSON.parse(cached.gemini_details);
        diagnosis = parsed.disease || cached.gemini_details;
        confidence = parsed.confidence || null;
      } catch { /* stored as plain text from old records */ }

      return res.json({
        success: true,
        data: { ...cached, diagnosis, confidence, details: cached.gemini_details },
      });
    }

    const result = await pool.query(
      "SELECT * FROM predictions WHERE id = $1",
      [predictionId]
    );

    if (result.rows.length > 0) {
      const data = result.rows[0];
      if (data.status === "complete") {
        await cacheSet(cacheKey, data, 1800);
      }

      let diagnosis = data.gemini_details;
      let confidence = null;
      try {
        const parsed = JSON.parse(data.gemini_details);
        diagnosis = parsed.disease || data.gemini_details;
        confidence = parsed.confidence || null;
      } catch { /* stored as plain text from old records */ }

      res.json({
        success: true,
        data: { ...data, diagnosis, confidence, details: data.gemini_details },
      });
    } else {
      res.status(404).json({ success: false, error: "Prediction not found." });
    }
  } catch (error) {
    console.error("Error in GET /prediction:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch prediction." });
  }
};
