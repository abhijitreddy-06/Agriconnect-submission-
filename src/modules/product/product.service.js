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

const parseBoolean = (value) => {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return undefined;
};

const seasonalCategoriesByMonth = {
  1: ["Vegetables", "Fruits", "Dairy"],
  2: ["Vegetables", "Fruits", "Spices"],
  3: ["Vegetables", "Grains & Cereals", "Pulses & Legumes"],
  4: ["Vegetables", "Fruits", "Nuts & Seeds"],
  5: ["Fruits", "Spices", "Nuts & Seeds"],
  6: ["Vegetables", "Pulses & Legumes", "Grains & Cereals"],
  7: ["Vegetables", "Pulses & Legumes", "Organic"],
  8: ["Vegetables", "Dairy", "Organic"],
  9: ["Fruits", "Spices", "Organic"],
  10: ["Vegetables", "Fruits", "Grains & Cereals"],
  11: ["Vegetables", "Fruits", "Pulses & Legumes"],
  12: ["Vegetables", "Fruits", "Dairy"],
};

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  if (![lat1, lng1, lat2, lng2].every((value) => Number.isFinite(Number(value)))) return null;

  const earthRadiusKm = 6371;
  const dLat = toRadians(Number(lat2) - Number(lat1));
  const dLng = toRadians(Number(lng2) - Number(lng1));

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(2));
};

const normalizeProductRow = (row, userLat, userLng) => {
  const distanceKm = getDistanceKm(userLat, userLng, row.latitude, row.longitude);

  return {
    ...row,
    product_avg_rating: Number(row.product_avg_rating || 0),
    product_total_reviews: Number(row.product_total_reviews || 0),
    farmer_avg_rating: Number(row.farmer_avg_rating || 0),
    farmer_total_reviews: Number(row.farmer_total_reviews || 0),
    is_organic: Boolean(row.is_organic),
    is_eco_certified: Boolean(row.is_eco_certified),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    distance_km: distanceKm,
  };
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

  const product = await ProductModel.create(
    farmerId,
    {
      ...body,
      price: parsedPrice,
      quantity: parsedQuantity,
      is_organic: parseBoolean(body.is_organic) || false,
      is_eco_certified: parseBoolean(body.is_eco_certified) || false,
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      farm_region: body.farm_region || null,
    },
    imagePath
  );
  await invalidateProductCache();

  return product.id;
};

export const getAllProducts = async (query) => {
  const farmerId = query.farmer_id;
  const category = query.category;
  const search = query.search;
  const minPrice = query.min_price != null ? Number(query.min_price) : null;
  const maxPrice = query.max_price != null ? Number(query.max_price) : null;
  const minRating = query.min_rating != null ? Number(query.min_rating) : null;
  const organic = parseBoolean(query.organic);
  const eco = parseBoolean(query.eco);
  const maxDistance = query.max_distance != null ? Number(query.max_distance) : null;
  const userLat = query.user_lat != null ? Number(query.user_lat) : null;
  const userLng = query.user_lng != null ? Number(query.user_lng) : null;
  const seasonal = parseBoolean(query.seasonal) === true;
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

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

  if (Number.isFinite(minPrice)) {
    params.push(minPrice);
    conditions.push(`p.price >= $${params.length}`);
  }

  if (Number.isFinite(maxPrice)) {
    params.push(maxPrice);
    conditions.push(`p.price <= $${params.length}`);
  }

  if (organic === true) {
    conditions.push("p.is_organic = true");
  }

  if (eco === true) {
    conditions.push("p.is_eco_certified = true");
  }

  if (Number.isFinite(minRating)) {
    params.push(minRating);
    conditions.push(`COALESCE(pr.avg_rating, 0) >= $${params.length}`);
  }

  if (seasonal) {
    const currentMonth = new Date().getMonth() + 1;
    const seasonalCategories = seasonalCategoriesByMonth[currentMonth] || ["Vegetables", "Fruits"];
    params.push(seasonalCategories);
    conditions.push(`p.category = ANY($${params.length})`);
  }

  const rows = await ProductModel.findAll({ conditions, params });

  const normalized = rows.map((row) => normalizeProductRow(row, userLat, userLng));

  const distanceFiltered = Number.isFinite(maxDistance)
    ? normalized.filter((item) => item.distance_km == null || item.distance_km <= maxDistance)
    : normalized;

  const total = distanceFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const data = distanceFiltered.slice(offset, offset + limit);

  return { data, total, page: safePage, limit, totalPages };
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
  const parsedLatitude = body.latitude != null ? Number(body.latitude) : null;
  const parsedLongitude = body.longitude != null ? Number(body.longitude) : null;
  const parsedOrganic = body.is_organic != null ? parseBoolean(body.is_organic) : undefined;
  const parsedEco = body.is_eco_certified != null ? parseBoolean(body.is_eco_certified) : undefined;

  if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 20000)) {
    throw new AppError("Price must be between 0 and 20000.", 400);
  }
  if (parsedQuantity !== null && (isNaN(parsedQuantity) || parsedQuantity < 0 || parsedQuantity > 2000)) {
    throw new AppError("Quantity must be between 0 and 2000.", 400);
  }

  if (parsedLatitude !== null && !Number.isFinite(parsedLatitude)) {
    throw new AppError("Latitude must be a valid number.", 400);
  }

  if (parsedLongitude !== null && !Number.isFinite(parsedLongitude)) {
    throw new AppError("Longitude must be a valid number.", 400);
  }

  await ProductModel.update(
    productId,
    {
      ...body,
      price: parsedPrice,
      quantity: parsedQuantity,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      farm_region: body.farm_region,
      is_organic: parsedOrganic,
      is_eco_certified: parsedEco,
    },
    imageUrl
  );
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

export const getRecommendations = async (productId, requestedLimit) => {
  const limit = Math.min(20, Math.max(1, Number(requestedLimit) || 6));
  const product = await ProductModel.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  const customersAlsoBought = await ProductModel.findCustomersAlsoBought(productId, limit);
  const seasonalSuggestions = await ProductModel.findSeasonalSuggestions(limit);

  return {
    customersAlsoBought: customersAlsoBought.map((row) => normalizeProductRow(row, null, null)),
    seasonalSuggestions: seasonalSuggestions
      .filter((row) => Number(row.id) !== Number(productId))
      .map((row) => normalizeProductRow(row, null, null)),
  };
};

export const getSeasonalSuggestions = async (requestedLimit) => {
  const limit = Math.min(20, Math.max(1, Number(requestedLimit) || 8));
  const rows = await ProductModel.findSeasonalSuggestions(limit);

  return {
    suggestions: rows.map((row) => normalizeProductRow(row, null, null)),
  };
};
