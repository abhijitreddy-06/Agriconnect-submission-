import catchAsync from "../../utils/catchAsync.js";
import * as PredictionService from "./prediction.service.js";

export const analyzeImage = catchAsync(async (req, res) => {
  const result = await PredictionService.analyzeImage(req.user.userId, req.file, req.body);
  return res.json({ success: true, ...result });
});

export const getPrediction = catchAsync(async (req, res) => {
  const data = await PredictionService.getPrediction(req.params.id);
  return res.json({ success: true, data });
});
