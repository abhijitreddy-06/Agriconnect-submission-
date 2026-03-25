import express from "express";
import { verifyToken, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { toggleWishlistSchema } from "./wishlist.validation.js";
import { toggleWishlist, getWishlist, getPriceDropNotifications } from "./wishlist.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("customer"));
router.get("/", getWishlist);
router.post("/toggle", validate(toggleWishlistSchema), toggleWishlist);
router.get("/notifications", getPriceDropNotifications);

export default router;
