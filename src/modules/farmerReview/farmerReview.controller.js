import catchAsync from "../../utils/catchAsync.js";
import * as FarmerReviewService from "./farmerReview.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const createFarmerReview = catchAsync(async (req, res) => {
  const result = await FarmerReviewService.createFarmerReview(req.user.userId, req.body);
  return sendResponse(res, 201, "Farmer review submitted successfully.", result);
});

export const getFarmerReviews = catchAsync(async (req, res) => {
  const result = await FarmerReviewService.getFarmerReviews(req.params.farmerId);
  return sendResponse(res, 200, "Farmer reviews fetched successfully.", result);
});
