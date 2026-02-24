import * as ReviewModel from "./review.model.js";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";

export const createReview = async (customerId, { order_id, rating, feedback }) => {
  const order = await ReviewModel.findOrder(order_id);
  if (!order) throw new AppError("Order not found.", 404);
  if (order.customer_id !== customerId) throw new AppError("You can only review your own orders.", 403);
  if (order.status !== "delivered") throw new AppError("You can only review delivered orders.", 400);

  const existing = await ReviewModel.findByOrderId(order_id);
  if (existing) throw new AppError("You have already reviewed this order.", 400);

  const review = await ReviewModel.create(order_id, order.product_id, customerId, rating, feedback);
  await cacheInvalidatePattern(`reviews:product:${order.product_id}`);

  return review;
};

export const getProductReviews = async (productId) => {
  const cacheKey = `reviews:product:${productId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const reviews = await ReviewModel.findByProductId(productId);
  const avgData = await ReviewModel.getAverageRating(productId);

  const responseData = {
    reviews,
    avgRating: parseFloat(parseFloat(avgData.avg_rating).toFixed(1)),
    totalReviews: parseInt(avgData.total_reviews),
  };

  await cacheSet(cacheKey, responseData, 180);
  return responseData;
};

export const checkReview = async (customerId, orderId) => {
  const review = await ReviewModel.findByOrderAndCustomer(orderId, customerId);
  return { reviewed: !!review, review: review || null };
};
