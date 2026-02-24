import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { addToCartSchema, updateCartSchema, idParamSchema, checkoutSchema } from "./cart.validation.js";
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart, checkout } from "./cart.controller.js";

const router = express.Router();

router.post("/", verifyToken, requireRole("customer"), validate(addToCartSchema), addToCart);
router.get("/", verifyToken, requireRole("customer"), getCart);
router.put("/:id", verifyToken, requireRole("customer"), validate(idParamSchema), validate(updateCartSchema), updateCartItem);
router.delete("/:id", verifyToken, requireRole("customer"), validate(idParamSchema), removeCartItem);
router.delete("/", verifyToken, requireRole("customer"), clearCart);
router.post("/checkout", verifyToken, requireRole("customer"), validate(checkoutSchema), checkout);

export default router;
