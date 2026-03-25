import * as ProductModel from "./product.model.js";
import supabase from "../../config/supabase.js";
import { cacheInvalidatePattern } from "../../config/redis.js";
import AppError from "../../utils/AppError.js";
import path from "path";

const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

const invalidateProductCache = async () => {
  await cacheInvalidatePattern("products:*");
};

const uploadToSupabase = async (fileBuffer, originalname, mimetype, userId) => {
  if (!supabase) {
    throw new AppError("Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY.", 500);
  }

  const ext = path.extname(originalname || ".jpg").toLowerCase();
  const filename = `products/${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, fileBuffer, {
      contentType: mimetype || "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return urlData.publicUrl;
};

const deleteFromSupabase = async (storagePath) => {
  if (!supabase || !storagePath || !storagePath.startsWith("products/")) return;
  await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
};

const getStoragePath = (imageUrl) => {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/object\/public\/[^/]+\/(.+)$/);
  return match ? match[1] : null;
};

export const createProduct = async (farmerId, body, file) => {
  const { product_name, price, quantity } = body;

  if (!product_name || price === undefined || quantity === undefined) {
    throw new AppError("Product name, price, and quantity are required.", 400);
  }

  const parsedPrice = parseFloat(price);
  const parsedQuantity = parseFloat(quantity);

  if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
    throw new AppError("Price and quantity must be valid numbers.", 400);
  }
  if (parsedQuantity > 2000) throw new AppError("Maximum allowed quantity is 2000.", 400);
  if (parsedPrice > 20000) throw new AppError("Maximum allowed price is 20000.", 400);

  let imagePath = "";
  if (file) {
    imagePath = await uploadToSupabase(file.buffer, file.originalname, file.mimetype, farmerId);
  }

  const product = await ProductModel.create(farmerId, { ...body, price: parsedPrice, quantity: parsedQuantity }, imagePath);
  await invalidateProductCache();

  return product.id;
};

export const getAllProducts = async (query) => {
  const farmerId = query.farmer_id;
  const category = query.category;
  const search = query.search;
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (farmerId) {
    params.push(parseInt(farmerId));
    conditions.push(`p.farmer_id = $${params.length}`);
  }
  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`p.product_name ILIKE $${params.length}`);
  }

  const { rows, total } = await ProductModel.findAll({ conditions, params, limit, offset });

  return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getProductById = async (productId) => {
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found.", 404);
  }
  return product;
};

export const updateProduct = async (farmerId, productId, body, file) => {
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);
  if (product.farmer_id !== farmerId) throw new AppError("You do not have permission to update this product.", 403);

  let imageUrl;
  if (file) {
    const oldPath = getStoragePath(product.image);
    if (oldPath) await deleteFromSupabase(oldPath);
    imageUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype, farmerId);
  }

  const parsedPrice = body.price != null ? parseFloat(body.price) : null;
  const parsedQuantity = body.quantity != null ? parseFloat(body.quantity) : null;

  if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 20000)) {
    throw new AppError("Price must be between 0 and 20000.", 400);
  }
  if (parsedQuantity !== null && (isNaN(parsedQuantity) || parsedQuantity < 0 || parsedQuantity > 2000)) {
    throw new AppError("Quantity must be between 0 and 2000.", 400);
  }

  await ProductModel.update(productId, { ...body, price: parsedPrice, quantity: parsedQuantity }, imageUrl);
  await invalidateProductCache();
};

export const deleteProduct = async (farmerId, productId) => {
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);
  if (product.farmer_id !== farmerId) throw new AppError("You do not have permission to delete this product.", 403);

  const storagePath = getStoragePath(product.image);
  if (storagePath) await deleteFromSupabase(storagePath);

  await ProductModel.remove(productId);
  await invalidateProductCache();
};
