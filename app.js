import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(cors());

// Gzip compression
app.use(compression());

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing (built-in Express, no need for body-parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message:
    '<script>alert("Too many attempts. Please try again later."); window.history.back();</script>',
});
app.use("/signup", authLimiter);
app.use("/login", authLimiter);
app.use("/signupcus", authLimiter);
app.use("/logincus", authLimiter);

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Routes
app.use(authRoutes);
app.use(productRoutes);
app.use(predictionRoutes);
app.use(pageRoutes);

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;
