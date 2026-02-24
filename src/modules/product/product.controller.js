import catchAsync from "../../utils/catchAsync.js";
import * as ProductService from "./product.service.js";

export const createProduct = catchAsync(async (req, res) => {
  const productId = await ProductService.createProduct(req.user.userId, req.body, req.file);
  return res.status(201).json({ success: true, productId, message: "Product created successfully." });
});

export const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductService.getAllProducts(req.query);
  return res.json({ success: true, ...result });
});

export const updateProduct = catchAsync(async (req, res) => {
  await ProductService.updateProduct(req.user.userId, req.params.id, req.body, req.file);
  return res.json({ success: true, message: "Product updated successfully." });
});

export const deleteProduct = catchAsync(async (req, res) => {
  await ProductService.deleteProduct(req.user.userId, req.params.id);
  return res.json({ success: true, message: "Product deleted successfully." });
});
