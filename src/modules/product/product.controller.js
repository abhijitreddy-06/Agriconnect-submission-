import catchAsync from "../../utils/catchAsync.js";
import * as ProductService from "./product.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const createProduct = catchAsync(async (req, res) => {
  const productId = await ProductService.createProduct(req.user.userId, req.body, req.file);
  return sendResponse(res, 201, "Product created successfully.", { productId });
});

export const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductService.getAllProducts(req.query);
  return sendResponse(res, 200, "Products fetched successfully.", result);
});

export const getProductById = catchAsync(async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);
  return sendResponse(res, 200, "Product fetched successfully.", product);
});

export const getRecommendations = catchAsync(async (req, res) => {
  const data = await ProductService.getRecommendations(req.params.id, req.query.limit);
  return sendResponse(res, 200, "Product recommendations fetched successfully.", data);
});

export const getSeasonalSuggestions = catchAsync(async (req, res) => {
  const data = await ProductService.getSeasonalSuggestions(req.query.limit);
  return sendResponse(res, 200, "Seasonal suggestions fetched successfully.", data);
});

export const updateProduct = catchAsync(async (req, res) => {
  await ProductService.updateProduct(req.user.userId, req.params.id, req.body, req.file);
  return sendResponse(res, 200, "Product updated successfully.", null);
});

export const deleteProduct = catchAsync(async (req, res) => {
  await ProductService.deleteProduct(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Product deleted successfully.", null);
});
