import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import farmerReviewRoutes from "./modules/farmerReview/farmerReview.routes.js";
import predictionRoutes from "./modules/prediction/prediction.routes.js";
import addressRoutes from "./modules/address/address.routes.js";
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";
import weatherRoutes from "./modules/weather/weather.routes.js";
import articleRoutes from "./modules/article/article.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import pageRoutes from "./modules/pages/pages.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enableFrontendServing = process.env.ENABLE_FRONTEND_SERVING === "true";

const parseAllowedOrigins = () => {
  const configured = [
    process.env.CORS_ORIGINS,
    process.env.FRONTEND_URL,
    process.env.BASE_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return Array.from(new Set(configured));
};

const allowedOrigins = parseAllowedOrigins();

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://images.unsplash.com", "https://source.unsplash.com"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
}));

app.use(compression());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AgriConnect API is running.",
    data: {
      frontendDevUrl: "http://localhost:5173",
      healthUrl: "/health",
    },
  });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later.", data: null },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/refresh", authLimiter);
app.use("/api/auth/logout", authLimiter);
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/signup", authLimiter);
app.use("/api/v1/auth/refresh", authLimiter);
app.use("/api/v1/auth/logout", authLimiter);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Please try again later.", data: null },
});
app.use("/api/products", apiLimiter);
app.use("/api/cart", apiLimiter);
app.use("/api/orders", apiLimiter);
app.use("/api/chat", apiLimiter);
app.use("/api/reviews", apiLimiter);
app.use("/api/addresses", apiLimiter);
app.use("/api/wishlist", apiLimiter);
app.use("/api/farmer-reviews", apiLimiter);
app.use("/api/weather", apiLimiter);
app.use("/api/articles", apiLimiter);
app.use("/api/v1/products", apiLimiter);
app.use("/api/v1/cart", apiLimiter);
app.use("/api/v1/orders", apiLimiter);
app.use("/api/v1/chat", apiLimiter);
app.use("/api/v1/reviews", apiLimiter);
app.use("/api/v1/addresses", apiLimiter);
app.use("/api/v1/wishlist", apiLimiter);
app.use("/api/v1/farmer-reviews", apiLimiter);
app.use("/api/v1/weather", apiLimiter);
app.use("/api/v1/articles", apiLimiter);
app.use("/api/v1/predict", apiLimiter);

app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

if (enableFrontendServing) {
  app.use(express.static(path.join(__dirname, "..", "public")));
}

app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/farmer-reviews", farmerReviewRoutes);
app.use("/api/v1/farmer-reviews", farmerReviewRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/v1/predict", predictionRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/v1/weather", weatherRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/v1/articles", articleRoutes);
app.use("/health", healthRoutes);
app.use("/api/v1/health", healthRoutes);

if (enableFrontendServing) {
  app.use(pageRoutes);
}

app.use(errorHandler);

export default app;
