import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import { getMessages, getChatInfo, sendMessage } from "./chat.controller.js";

const router = express.Router();

router.get("/:orderId", verifyToken, getMessages);
router.get("/:orderId/info", verifyToken, getChatInfo);
router.post("/:orderId", verifyToken, sendMessage);

export default router;
