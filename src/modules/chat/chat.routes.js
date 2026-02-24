import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import { getMessages, getChatInfo } from "./chat.controller.js";

const router = express.Router();

router.get("/:orderId", verifyToken, getMessages);
router.get("/:orderId/info", verifyToken, getChatInfo);

export default router;
