import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate, addToCartSchema, updateCartSchema, idParamSchema, checkoutSchema } from "../middleware/validate.js";
import {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    checkout,
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes require authenticated customer
router.post("/api/cart", verifyToken, requireRole("customer"), validate(addToCartSchema), addToCart);
router.get("/api/cart", verifyToken, requireRole("customer"), getCart);
router.put("/api/cart/:id", verifyToken, requireRole("customer"), validate(idParamSchema), validate(updateCartSchema), updateCartItem);
router.delete("/api/cart/:id", verifyToken, requireRole("customer"), validate(idParamSchema), removeCartItem);
router.delete("/api/cart", verifyToken, requireRole("customer"), clearCart);
router.post("/api/cart/checkout", verifyToken, requireRole("customer"), validate(checkoutSchema), checkout);

export default router;
