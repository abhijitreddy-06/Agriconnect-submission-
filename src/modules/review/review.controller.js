import catchAsync from "../../utils/catchAsync.js";
import * as ReviewService from "./review.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const createReview = catchAsync(async (req, res) => {
  const data = await ReviewService.createReview(req.user.userId, req.body);
  return sendResponse(res, 201, "Review submitted successfully.", data);
});

export const getProductReviews = catchAsync(async (req, res) => {
  const data = await ReviewService.getProductReviews(req.params.productId);
  return sendResponse(res, 200, "Product reviews fetched successfully.", data);
});

export const checkReview = catchAsync(async (req, res) => {
  const data = await ReviewService.checkReview(req.user.userId, req.params.orderId);
  return sendResponse(res, 200, "Review status fetched successfully.", data);
});
