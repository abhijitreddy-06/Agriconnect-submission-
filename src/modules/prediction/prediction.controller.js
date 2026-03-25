import catchAsync from "../../utils/catchAsync.js";
import * as PredictionService from "./prediction.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const analyzeImage = catchAsync(async (req, res) => {
  const result = await PredictionService.analyzeImage(req.user.userId, req.file, req.body);
  return sendResponse(res, 200, "Image analyzed successfully.", result);
});

export const getPrediction = catchAsync(async (req, res) => {
  const data = await PredictionService.getPrediction(req.params.id);
  return sendResponse(res, 200, "Prediction fetched successfully.", data);
});
