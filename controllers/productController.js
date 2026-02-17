import pool from "../config/database.js";
import { cacheInvalidatePattern } from "../config/redis.js";

// Helper: Invalidate all product caches
const invalidateProductCache = async () => {
  await cacheInvalidatePattern("products:*");
};

// POST /api/products - Create a new product
export const createProduct = async (req, res) => {
  try {
    const farmerId = req.user.userId; // From JWT token
    const {
      product_name,
      price,
      quantity,
      quality,
      description,
      quantity_unit,
    } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

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

    // Insert product with farmer_id
    const result = await pool.query(
      `INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [farmerId, product_name, parsedPrice, parsedQuantity, quality || "", description || "", imagePath, quantity_unit || ""]
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

// GET /api/products - Get all products (with optional filters)
export const getAllProducts = async (req, res) => {
  try {
    const farmerId = req.query.farmer_id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM products";
    const params = [];

    if (farmerId) {
      query += " WHERE farmer_id = $1";
      params.push(parseInt(farmerId));
    }

    query += " ORDER BY id DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows,
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
    const { product_name, price, quantity, quality, description, quantity_unit } = req.body;

    // Verify ownership
    const product = await pool.query(
      "SELECT farmer_id FROM products WHERE id = $1",
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

    // Update product
    const updateQuery = `
      UPDATE products
      SET product_name = COALESCE($1, product_name),
          price = COALESCE($2, price),
          quantity = COALESCE($3, quantity),
          quality = COALESCE($4, quality),
          description = COALESCE($5, description),
          quantity_unit = COALESCE($6, quantity_unit)
      WHERE id = $7
    `;

    await pool.query(updateQuery, [
      product_name,
      price ? parseFloat(price) : null,
      quantity ? parseFloat(quantity) : null,
      quality,
      description,
      quantity_unit,
      productId,
    ]);

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
      "SELECT farmer_id FROM products WHERE id = $1",
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
