import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, "..", "public", "pages");
const router = express.Router();

// Default route
router.get("/", (req, res) => {
  res.sendFile(path.join(pagesDir, "index.html"));
});

// Auth pages
router.get("/login/farmer", (req, res) => {
  res.sendFile(path.join(pagesDir, "login.html"));
});
router.get("/signup/farmer", (req, res) => {
  res.sendFile(path.join(pagesDir, "signUp.html"));
});
router.get("/signup/customer", (req, res) => {
  res.sendFile(path.join(pagesDir, "signupcus.html"));
});
router.get("/login/customer", (req, res) => {
  res.sendFile(path.join(pagesDir, "logincus.html"));
});

// Dashboard pages
router.get("/dashboard/farmer", (req, res) => {
  res.sendFile(path.join(pagesDir, "homepage.html"));
});
router.get("/dashboard/customer", (req, res) => {
  res.sendFile(path.join(pagesDir, "homepage_cus.html"));
});

// Feature pages
router.get("/sell", (req, res) => {
  res.sendFile(path.join(pagesDir, "selling.html"));
});
router.get("/marketplace/farmer", (req, res) => {
  res.sendFile(path.join(pagesDir, "farmer-market.html"));
});
router.get("/marketplace/customer", (req, res) => {
  res.sendFile(path.join(pagesDir, "farmer-market_cus.html"));
});
router.get("/cart", (req, res) => {
  res.sendFile(path.join(pagesDir, "cart.html"));
});
router.get("/orders", (req, res) => {
  res.sendFile(path.join(pagesDir, "orders.html"));
});
router.get("/diagnosis", (req, res) => {
  res.sendFile(path.join(pagesDir, "prediction.html"));
});
router.get("/plant-health", (req, res) => {
  res.sendFile(path.join(pagesDir, "symptom.html"));
});
router.get("/get-started", (req, res) => {
  res.sendFile(path.join(pagesDir, "whichusers.html"));
});
router.get("/profile", (req, res) => {
  res.sendFile(path.join(pagesDir, "profile.html"));
});

// Favicon
router.get("/favicon.ico", (req, res) => res.status(204).end());

export default router;
