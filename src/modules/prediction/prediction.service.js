import axios from "axios";
import FormData from "form-data";
import * as PredictionModel from "./prediction.model.js";
import { cacheGet, cacheSet } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

const HF_API_URL = process.env.HF_API_URL || "https://ajay123naik-plant-disease-api.hf.space/predict";

async function callHFWithRetry(file, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", file.buffer, {
        filename: file.originalname || "plant.jpg",
        contentType: file.mimetype || "image/jpeg",
      });

      const response = await axios.post(HF_API_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 120000,
      });

      return response.data;
    } catch (err) {
      const isRetryable =
        err.code === "ECONNABORTED" ||
        err.code === "ETIMEDOUT" ||
        (err.response && (err.response.status === 503 || err.response.status === 502));

      if (attempt < retries && isRetryable) {
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }
      throw err;
    }
  }
}

function parsePredictionResult(predictionResult) {
  let diagnosis = predictionResult;
  let confidence = null;
  try {
    const parsed = JSON.parse(predictionResult);
    diagnosis = parsed.disease || predictionResult;
    confidence = parsed.confidence || null;
  } catch { /* stored as plain text from old records */ }
  return { diagnosis, confidence };
}

export const analyzeImage = async (userId, file, body) => {
  if (!file) throw new AppError("No image uploaded.", 400);

  const desc = body.description || "";
  const lang = body.language || "en";

  const prediction = await PredictionModel.createPrediction(userId, desc, lang);
  const predictionId = prediction.id;

  try {
    const hfResult = await callHFWithRetry(file);
    const hfData = Array.isArray(hfResult) ? (hfResult[0] || {}) : (hfResult || {});

    const diagnosisResult = JSON.stringify({
      disease: hfData.prediction || hfData.class || hfData.label || "Unknown",
      confidence: hfData.confidence || hfData.score || null,
      raw: hfResult,
    });

    await PredictionModel.updateResult(predictionId, diagnosisResult, "complete");

    const parsed = JSON.parse(diagnosisResult);
    return {
      predictionId,
      data: {
        diagnosis: parsed.disease,
        confidence: parsed.confidence,
        details: diagnosisResult,
      },
    };
  } catch {
    await PredictionModel.markFailed(predictionId);
    throw new AppError("Analysis failed. Please try again.", 500);
  }
};

export const getPrediction = async (predictionId) => {
  const cacheKey = `prediction:${predictionId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    const { diagnosis, confidence } = parsePredictionResult(cached.prediction_result);
    return { ...cached, diagnosis, confidence, details: cached.prediction_result };
  }

  const data = await PredictionModel.findById(predictionId);
  if (!data) throw new AppError("Prediction not found.", 404);

  if (data.status === "complete") {
    await cacheSet(cacheKey, data, 1800);
  }

  const { diagnosis, confidence } = parsePredictionResult(data.prediction_result);
  return { ...data, diagnosis, confidence, details: data.prediction_result };
};
