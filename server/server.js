require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Validate required env vars at startup
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");
const commonFeatureRouter = require("./routes/common/feature-routes");
const supportIntegrationRouter = require("./routes/integrations/support-routes");
const { getAllowedOrigins } = require("./helpers/app-url");
const jobformIntegrationRouter = require("./routes/integrations/jobform-routes");

// Connect to MongoDB after the HTTP server is up so Railway healthchecks
// can succeed even while Atlas DNS/auth is still settling.
const app = express();
const PORT = Number(process.env.PORT) || 5011;

// Railway/Render run behind a reverse proxy; this is required for correct client IP detection
// in express-rate-limit and avoids ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

// Security headers — relax CSP for the React SPA
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS — supports comma-separated CLIENT_URL (e.g. production domain + localhost)
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "Expires", "Pragma"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/admin/products", apiLimiter, adminProductsRouter);
app.use("/api/admin/orders", apiLimiter, adminOrderRouter);
app.use("/api/shop/products", apiLimiter, shopProductsRouter);
app.use("/api/shop/cart", apiLimiter, shopCartRouter);
app.use("/api/shop/address", apiLimiter, shopAddressRouter);
app.use("/api/shop/order", apiLimiter, shopOrderRouter);
app.use("/api/shop/search", apiLimiter, shopSearchRouter);
app.use("/api/shop/review", apiLimiter, shopReviewRouter);
app.use("/api/common/feature", apiLimiter, commonFeatureRouter);
app.use("/api/integrations/support", apiLimiter, supportIntegrationRouter);
app.use("/api/integrations/jobform", apiLimiter, jobformIntegrationRouter);

// Serve static React build in production
const clientBuildPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientBuildPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Centralized error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
});
