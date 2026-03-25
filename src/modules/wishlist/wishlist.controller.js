import catchAsync from "../../utils/catchAsync.js";
import * as WishlistService from "./wishlist.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const toggleWishlist = catchAsync(async (req, res) => {
  const result = await WishlistService.toggleWishlist(req.user.userId, Number(req.body.product_id));
  return sendResponse(res, 200, result.wishlisted ? "Added to wishlist." : "Removed from wishlist.", result);
});

export const getWishlist = catchAsync(async (req, res) => {
  const result = await WishlistService.getWishlist(req.user.userId);
  return sendResponse(res, 200, "Wishlist fetched successfully.", result);
});

export const getPriceDropNotifications = catchAsync(async (req, res) => {
  const result = await WishlistService.getPriceDropNotifications(req.user.userId);
  return sendResponse(res, 200, "Wishlist price notifications fetched successfully.", result);
});
