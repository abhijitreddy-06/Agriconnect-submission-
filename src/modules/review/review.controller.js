import catchAsync from "../../utils/catchAsync.js";
import * as ReviewService from "./review.service.js";

export const createReview = catchAsync(async (req, res) => {
  const data = await ReviewService.createReview(req.user.userId, req.body);
  return res.status(201).json({ success: true, message: "Review submitted successfully.", data });
});

export const getProductReviews = catchAsync(async (req, res) => {
  const data = await ReviewService.getProductReviews(req.params.productId);
  return res.json({ success: true, ...data });
});

export const checkReview = catchAsync(async (req, res) => {
  const data = await ReviewService.checkReview(req.user.userId, req.params.orderId);
  return res.json({ success: true, ...data });
});
