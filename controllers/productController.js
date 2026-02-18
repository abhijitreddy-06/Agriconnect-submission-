import pool from "../config/database.js";
import supabase from "../config/supabase.js";
import { cacheInvalidatePattern } from "../config/redis.js";
import path from "path";

const BUCKET = process.env.SUPABASE_BUCKET || "uploads";

// Helper: Invalidate all product caches
const invalidateProductCache = async () => {
  await cacheInvalidatePattern("products:*");
};

// Helper: Upload image buffer to Supabase Storage, return public URL
const uploadToSupabase = async (fileBuffer, originalname, mimetype, userId) => {
  if (!supabase) {
    throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY.");
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
  return { publicUrl: urlData.publicUrl, storagePath: filename };
};

// Helper: Delete image from Supabase Storage
const deleteFromSupabase = async (storagePath) => {
  if (!supabase || !storagePath || !storagePath.startsWith("products/")) return;
  await supabase.storage.from(BUCKET).remove([storagePath]).catch((err) => {
    console.error("Failed to delete image from Supabase:", storagePath, err.message);
  });
};

// Extract storage path from a Supabase public URL
const getStoragePath = (imageUrl) => {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/object\/public\/[^/]+\/(.+)$/);
  return match ? match[1] : null;
};

// POST /api/products - Create a new product
export const createProduct = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const {
      product_name,
      price,
      quantity,
      quality,
      description,
      quantity_unit,
      category,
    } = req.body;

    // Validation
    if (!product_name || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: "Product name, price, and quantity are required.",
      });
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseFloat(quantity);

    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      return res.status(400).json({
        success: false,
        error: "Price and quantity must be valid numbers.",
      });
    }

    if (parsedQuantity > 2000) {
      return res.status(400).json({
        success: false,
        error: "Maximum allowed quantity is 2000.",
      });
    }

    if (parsedPrice > 20000) {
      return res.status(400).json({
        success: false,
        error: "Maximum allowed price is 20000.",
      });
    }

    // Upload image to Supabase Storage
    let imagePath = "";
    if (req.file) {
      const { publicUrl } = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        farmerId
      );
      imagePath = publicUrl;
    }

    // Insert product with farmer_id
    const result = await pool.query(
      `INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [farmerId, product_name, parsedPrice, parsedQuantity, quality || "", description || "", imagePath, quantity_unit || "", category || ""]
    );

    // Invalidate product cache
    await invalidateProductCache();

    return res.status(201).json({
      success: true,
      productId: result.rows[0].id,
      message: "Product created successfully.",
    });
  } catch (error) {
    console.error("Error creating product:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create product.",
    });
  }
};

// GET /api/products - Get all products (with optional filters and search)
export const getAllProducts = async (req, res) => {
  try {
    const farmerId = req.query.farmer_id;
    const category = req.query.category;
    const search = req.query.search;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (farmerId) {
      params.push(parseInt(farmerId));
      conditions.push(`farmer_id = $${params.length}`);
    }

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`product_name ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

    // Count total matching rows
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products${whereClause}`,
      params.slice()
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch paginated results
    params.push(limit, offset);
    const dataQuery = `SELECT * FROM products${whereClause} ORDER BY id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(dataQuery, params);

    return res.json({
      success: true,
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch products.",
    });
  }
};

// PUT /api/products/:id - Update a product
export const updateProduct = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const productId = req.params.id;
    const { product_name, price, quantity, quality, description, quantity_unit, category } = req.body;

    // Verify ownership
    const product = await pool.query(
      "SELECT farmer_id, image FROM products WHERE id = $1",
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found.",
      });
    }

    if (product.rows[0].farmer_id !== farmerId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to update this product.",
      });
    }

    // Handle image update
    let imageUpdate = "";
    if (req.file) {
      // Delete old image from Supabase if it's a Supabase URL
      const oldPath = getStoragePath(product.rows[0].image);
      if (oldPath) await deleteFromSupabase(oldPath);

      const { publicUrl } = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        farmerId
      );
      imageUpdate = publicUrl;
    }

    // Validate price and quantity limits on update
    const parsedPrice = price != null ? parseFloat(price) : null;
    const parsedQuantity = quantity != null ? parseFloat(quantity) : null;

    if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 20000)) {
      return res.status(400).json({
        success: false,
        error: "Price must be between 0 and 20000.",
      });
    }

    if (parsedQuantity !== null && (isNaN(parsedQuantity) || parsedQuantity < 0 || parsedQuantity > 2000)) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be between 0 and 2000.",
      });
    }

    // Update product
    const updateQuery = `
      UPDATE products
      SET product_name = COALESCE($1, product_name),
          price = COALESCE($2, price),
          quantity = COALESCE($3, quantity),
          quality = COALESCE($4, quality),
          description = COALESCE($5, description),
          quantity_unit = COALESCE($6, quantity_unit),
          category = COALESCE($7, category)
          ${req.file ? ", image = $9" : ""}
      WHERE id = $8
    `;

    const params = [
      product_name,
      parsedPrice,
      parsedQuantity,
      quality,
      description,
      quantity_unit,
      category,
      productId,
    ];

    if (req.file) params.push(imageUpdate);

    await pool.query(updateQuery, params);

    // Invalidate product cache
    await invalidateProductCache();

    return res.json({
      success: true,
      message: "Product updated successfully.",
    });
  } catch (error) {
    console.error("Error updating product:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update product.",
    });
  }
};

// DELETE /api/products/:id - Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const productId = req.params.id;

    // Verify ownership
    const product = await pool.query(
      "SELECT farmer_id, image FROM products WHERE id = $1",
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found.",
      });
    }

    if (product.rows[0].farmer_id !== farmerId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to delete this product.",
      });
    }

    // Delete image from Supabase
    const storagePath = getStoragePath(product.rows[0].image);
    if (storagePath) await deleteFromSupabase(storagePath);

    // Delete product
    await pool.query("DELETE FROM products WHERE id = $1", [productId]);

    // Invalidate product cache
    await invalidateProductCache();

    return res.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to delete product.",
    });
  }
};
