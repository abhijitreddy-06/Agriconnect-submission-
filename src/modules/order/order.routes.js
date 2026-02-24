import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createOrderSchema, updateOrderSchema, idParamSchema } from "./order.validation.js";
import { createOrder, getOrders, getOrderById, updateOrder, cancelOrder } from "./order.controller.js";

const router = express.Router();

router.post("/", verifyToken, requireRole("customer"), validate(createOrderSchema), createOrder);
router.get("/", verifyToken, getOrders);
router.get("/:id", verifyToken, validate(idParamSchema), getOrderById);
router.put("/:id/cancel", verifyToken, requireRole("customer"), validate(idParamSchema), cancelOrder);
router.put("/:id", verifyToken, requireRole("farmer"), validate(idParamSchema), validate(updateOrderSchema), updateOrder);

export default router;
