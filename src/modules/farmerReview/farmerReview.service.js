import * as FarmerReviewModel from "./farmerReview.model.js";
import AppError from "../../utils/AppError.js";

export const createFarmerReview = async (customerId, payload) => {
  const { order_id, reliability_rating, quality_rating, feedback } = payload;

  const order = await FarmerReviewModel.findDeliveredOrderForCustomer(order_id, customerId);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.status !== "delivered") throw new AppError("Farmer can be reviewed only after delivery.", 400);

  const existing = await FarmerReviewModel.findByOrderId(order_id);
  if (existing) throw new AppError("You have already reviewed this farmer for this order.", 400);

  const combined = Number(((Number(reliability_rating) + Number(quality_rating)) / 2).toFixed(2));
  return FarmerReviewModel.create({
    orderId: Number(order_id),
    farmerId: Number(order.farmer_id),
    customerId,
    reliabilityRating: Number(reliability_rating),
    qualityRating: Number(quality_rating),
    rating: combined,
    feedback,
  });
};

export const getFarmerReviews = async (farmerId) => {
  const reviews = await FarmerReviewModel.findByFarmerId(Number(farmerId));
  const stats = await FarmerReviewModel.getFarmerStats(Number(farmerId));

  return {
    farmerId: Number(farmerId),
    averageRating: Number(stats.avg_rating || 0),
    averageReliability: Number(stats.avg_reliability || 0),
    averageQuality: Number(stats.avg_quality || 0),
    totalReviews: Number(stats.total_reviews || 0),
    reviews,
  };
};
