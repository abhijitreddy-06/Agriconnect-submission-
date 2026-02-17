import express from "express";
import { signup, login, refresh, logout, verifyAuth } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public auth routes
router.post("/api/auth/signup", signup);
router.post("/api/auth/login", login);
router.post("/api/auth/refresh", refresh);
router.post("/api/auth/logout", logout);

// Protected auth routes
router.get("/api/auth/verify", verifyToken, verifyAuth);

// Legacy routes (redirect to new API — keeps old form actions working during transition)
router.post("/signup", signup);
router.post("/login", login);

export default router;
