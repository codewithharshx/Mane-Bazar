import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { getRuntimeConfig, validateRuntimeConfig } from "./config/env.js";
import { notFound, errorHandler } from "./presentation/middleware/errorMiddleware.js";
import { attachRequestContext } from "./presentation/middleware/requestContext.js";
import { ensureCsrfCookie, requireCsrfForUnsafeMethods } from "./presentation/middleware/csrfProtection.js";
import { globalApiRateLimiter } from "./presentation/middleware/rateLimiter.js";
import { initEmailService, shutdownEmailService } from "./infrastructure/services/emailService.js";
import { cleanupExpiredPendingOrders } from "./infrastructure/services/orderService.js";
import prisma from "./infrastructure/database/prisma.js";
import authRoutes from "./presentation/routes/authRoutes.js";
import categoryRoutes from "./presentation/routes/categoryRoutes.js";
import productRoutes from "./presentation/routes/productRoutes.js";
import storeRoutes from "./presentation/routes/storeRoutes.js";
import couponRoutes from "./presentation/routes/couponRoutes.js";
import orderRoutes from "./presentation/routes/orderRoutes.js";
import paymentRoutes from "./presentation/routes/paymentRoutes.js";
import adminRoutes from "./presentation/routes/adminRoutes.js";
import { handleWebhook } from "./presentation/controllers/webhookController.js";
import path from "path";
import fs from "fs";
import configurePassport from "./config/passport.js";

// Load env vars: check apps/backend/.env, then fallback to current directory
const backendEnvPath = path.resolve(process.cwd(), "apps/backend/.env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
dotenv.config();

// Catch unhandled rejections for debugging
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// Custom morgan token for requestId
morgan.token("request-id", (req: any) => req.requestId || "-");

const createApp = () => {
  configurePassport();
  const app = express();

  const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"];
  const whitelist = (process.env.CORS_WHITELIST || process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = whitelist.length ? whitelist : defaultOrigins;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://accounts.google.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.razorpay.com", "https://accounts.google.com", "https://oauth2.googleapis.com"],
          frameSrc: ["'self'", "https://checkout.razorpay.com", "https://accounts.google.com"],
          objectSrc: ["'none'"],
        },
      },
    })
  );

  // Razorpay Webhook — MUST be registered before express.json()
  app.post("/api/payment/webhook", express.raw({ type: "application/json" }), handleWebhook);

  // Body parsers
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(ensureCsrfCookie);
  app.use(attachRequestContext);
  app.use(passport.initialize());

  app.use(morgan(":request-id :method :url :status :response-time ms - :res[content-length]"));

  // Health checks
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "mane-bazar-api",
      requestId: req.requestId,
      ts: new Date().toISOString(),
    });
  });

  // API versioning prefix
  const apiRouter = express.Router();

  // CSRF verification on unsafe methods for API router
  apiRouter.use(requireCsrfForUnsafeMethods);
  apiRouter.use(globalApiRateLimiter);

  // Authentication endpoints
  apiRouter.use("/auth", authRoutes);

  // Domain routes
  apiRouter.use("/categories", categoryRoutes);
  apiRouter.use("/products", productRoutes);
  apiRouter.use("/stores", storeRoutes);
  apiRouter.use("/coupons", couponRoutes);
  apiRouter.use("/orders", orderRoutes);
  apiRouter.use("/payment", paymentRoutes);
  apiRouter.use("/admin", adminRoutes);

  // Mount API router
  app.use("/api/v1", apiRouter);
  // Maintain backward compatibility for /api prefix
  app.use("/api", apiRouter);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const startServer = async () => {
  try {
    validateRuntimeConfig();

    // Connect to PostgreSQL via Prisma
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL");

    await initEmailService();

    const app = createApp();
    const PORT = Number(process.env.PORT) || 5000;

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });

    // Pending payment sweep
    let isRunningPendingSweep = false;
    const pendingSweepInterval = setInterval(async () => {
      if (isRunningPendingSweep) return;
      isRunningPendingSweep = true;
      try {
        const result = await cleanupExpiredPendingOrders({ limit: 100 });
        if (result.cleaned > 0 || result.failed > 0) {
          console.log(`[pending-payment-cleanup] scanned=${result.scanned} cleaned=${result.cleaned} failed=${result.failed}`);
        }
      } catch (error: any) {
        console.error("[pending-payment-cleanup] run failed:", error.message);
      } finally {
        isRunningPendingSweep = false;
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    const shutdown = (signal: string) => async () => {
      console.log(`${signal} received — shutting down gracefully...`);
      clearInterval(pendingSweepInterval);
      server.close(async () => {
        try {
          await shutdownEmailService();
          await prisma.$disconnect();
        } catch (error: any) {
          console.error("Error during shutdown:", error.message);
        }
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown("SIGTERM"));
    process.on("SIGINT", shutdown("SIGINT"));
  } catch (error: any) {
    console.error("❌ Unable to start server:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

startServer();
