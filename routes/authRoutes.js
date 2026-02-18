import express from "express";
import { signup, login, refresh, logout, verifyAuth, updateProfile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import { validate, signupSchema, loginSchema, refreshSchema, updateProfileSchema } from "../middleware/validate.js";

const router = express.Router();

// Public auth routes
router.post("/api/auth/signup", validate(signupSchema), signup);
router.post("/api/auth/login", validate(loginSchema), login);
router.post("/api/auth/refresh", validate(refreshSchema), refresh);
router.post("/api/auth/logout", logout);

// Protected auth routes
router.get("/api/auth/verify", verifyToken, verifyAuth);
router.put("/api/auth/profile", verifyToken, validate(updateProfileSchema), updateProfile);

export default router;
