import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getMessages, getChatInfo } from "../controllers/chatController.js";

const router = express.Router();

// Get chat messages for an order
router.get("/api/chat/:orderId", verifyToken, getMessages);

// Get chat partner info (no phone numbers exposed)
router.get("/api/chat/:orderId/info", verifyToken, getChatInfo);

export default router;
