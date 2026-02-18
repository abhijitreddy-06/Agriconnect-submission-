import express from "express";
import upload from "../middleware/upload.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { cacheMiddleware } from "../middleware/cache.js";
import { validate, productQuerySchema, idParamSchema } from "../middleware/validate.js";
import {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Public: Get all products (with Redis caching — 5 min TTL)
router.get(
    "/api/products",
    validate(productQuerySchema),
    cacheMiddleware(
        (req) => {
            const farmerId = req.query.farmer_id || "all";
            const category = req.query.category || "all";
            const search = req.query.search || "";
            const page = req.query.page || "1";
            const limit = req.query.limit || "20";
            return `products:${farmerId}:cat:${category}:search:${search}:page:${page}:limit:${limit}`;
        },
        300 // 5 minutes
    ),
    getAllProducts
);

// Protected: Farmer-only product management
// Note: Product body validation happens in the controller since multipart form data
// is parsed by multer after the middleware chain starts
router.post(
    "/api/products",
    verifyToken,
    requireRole("farmer"),
    upload.single("productImage"),
    createProduct
);

router.put(
    "/api/products/:id",
    verifyToken,
    requireRole("farmer"),
    validate(idParamSchema),
    upload.single("productImage"),
    updateProduct
);

router.delete(
    "/api/products/:id",
    verifyToken,
    requireRole("farmer"),
    validate(idParamSchema),
    deleteProduct
);

export default router;
