import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, "..", "public", "pages");
const router = express.Router();

// Route table: [url, html file]
const pages = [
  ["/", "index.html"],
  ["/login/farmer", "login.html"],
  ["/signup/farmer", "signUp.html"],
  ["/signup/customer", "signupcus.html"],
  ["/login/customer", "logincus.html"],
  ["/dashboard/farmer", "homepage.html"],
  ["/dashboard/customer", "homepage_cus.html"],
  ["/sell", "selling.html"],
  ["/my-products", "my-products.html"],
  ["/marketplace/farmer", "farmer-market.html"],
  ["/marketplace/customer", "farmer-market_cus.html"],
  ["/cart", "cart.html"],
  ["/orders", "orders.html"],
  ["/chat", "chat.html"],
  ["/diagnosis", "prediction.html"],
  ["/plant-health", "symptom.html"],
  ["/get-started", "whichusers.html"],
  ["/profile", "profile.html"],
];

for (const [route, file] of pages) {
  router.get(route, (req, res) => res.sendFile(path.join(pagesDir, file)));
}

// Favicon
router.get("/favicon.ico", (req, res) => res.status(204).end());

export default router;
