import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.js";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Customer: Create order
router.post("/api/orders", verifyToken, requireRole("customer"), createOrder);

// Both roles: Get own orders
router.get("/api/orders", verifyToken, getOrders);

// Both roles: Get single order
router.get("/api/orders/:id", verifyToken, getOrderById);

// Customer: Cancel order (must come before :id PUT to avoid route conflict)
router.put("/api/orders/:id/cancel", verifyToken, requireRole("customer"), cancelOrder);

// Farmer only: Update order status
router.put("/api/orders/:id", verifyToken, requireRole("farmer"), updateOrder);

export default router;
