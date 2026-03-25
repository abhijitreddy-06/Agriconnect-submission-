import express from "express";
import upload from "../../middleware/upload.js";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { cacheMiddleware } from "../../middleware/cache.js";
import { validate } from "../../middleware/validate.js";
import { productQuerySchema, idParamSchema } from "./product.validation.js";
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from "./product.controller.js";

const router = express.Router();

router.get(
  "/",
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
    300
  ),
  getAllProducts
);

router.post(
  "/",
  verifyToken,
  requireRole("farmer"),
  upload.single("productImage"),
  createProduct
);

router.get("/:id", validate(idParamSchema), getProductById);

router.put(
  "/:id",
  verifyToken,
  requireRole("farmer"),
  validate(idParamSchema),
  upload.single("productImage"),
  updateProduct
);

router.delete(
  "/:id",
  verifyToken,
  requireRole("farmer"),
  validate(idParamSchema),
  deleteProduct
);

export default router;
