import * as WishlistModel from "./wishlist.model.js";
import * as ProductModel from "../product/product.model.js";
import AppError from "../../utils/AppError.js";

export const toggleWishlist = async (customerId, productId) => {
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  const existing = await WishlistModel.findByCustomerAndProduct(customerId, productId);
  if (existing) {
    await WishlistModel.remove(customerId, productId);
    return { wishlisted: false };
  }

  await WishlistModel.create(customerId, productId, Number(product.price || 0));
  return { wishlisted: true };
};

export const getWishlist = async (customerId) => {
  const items = await WishlistModel.findWishlistByCustomer(customerId);

  return {
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      image: item.image,
      category: item.category,
      quality: item.quality,
      price: Number(item.price || 0),
      savedPrice: Number(item.price_at_add || 0),
      farmerName: item.farmer_name,
      isOrganic: Boolean(item.is_organic),
      isEcoCertified: Boolean(item.is_eco_certified),
      rating: Number(item.product_avg_rating || 0),
      totalReviews: Number(item.product_total_reviews || 0),
      addedAt: item.created_at,
    })),
  };
};

export const getPriceDropNotifications = async (customerId) => {
  const drops = await WishlistModel.findPriceDropsByCustomer(customerId);

  return {
    notifications: drops.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      image: item.image,
      previousPrice: Number(item.price_at_add || 0),
      currentPrice: Number(item.current_price || 0),
      dropAmount: Number(item.price_at_add || 0) - Number(item.current_price || 0),
    })),
  };
};
