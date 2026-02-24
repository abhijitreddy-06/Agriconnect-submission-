import express from "express";
import { signup, login, refresh, logout, verifyAuth, updateProfile } from "./auth.controller.js";
import { verifyToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { signupSchema, loginSchema, refreshSchema, updateProfileSchema } from "./auth.validation.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", logout);

router.get("/verify", verifyToken, verifyAuth);
router.put("/profile", verifyToken, validate(updateProfileSchema), updateProfile);

export default router;
