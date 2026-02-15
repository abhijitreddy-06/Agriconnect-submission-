import express from "express";
import upload from "../middleware/upload.js";
import { createProduct, getAllProducts } from "../controllers/productController.js";

const router = express.Router();

router.post("/api/products", upload.single("productImage"), createProduct);
router.get("/api/products", getAllProducts);

export default router;
