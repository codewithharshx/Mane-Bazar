const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");

// Load env vars before everything else
dotenv.config();

const passport = require("passport");
const { connectDB, disconnectDB, getDbHealth } = require("./config/db");
const configurePassport = require("./config/passport");
const { getRuntimeConfig, validateRuntimeConfig } = require("./config/env");
const { handleWebhook } = require("./controllers/webhookController");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { attachRequestContext } = require("./middleware/requestContext");
const { ensureCsrfCookie, requireCsrfForUnsafeMethods } = require("./middleware/csrfProtection");
const { authRateLimiter, globalApiRateLimiter } = require("./middleware/rateLimiter");
const { ensureSeeded } = require("./utils/seedData");
const { initEmailService, shutdownEmailService } = require("./services/emailService");
const { cleanupExpiredPendingOrders } = require("./services/orderService");

morgan.token("request-id", (req) => req.requestId || "-");

// ─── App factory ──────────────────────────────────────────────────────────
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
        return callback(null, false);
      },
      credentials: true
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
          objectSrc: ["'none'"]
        }
      }
    })
  );

  // ── Razorpay Webhook — MUST be registered before express.json() ──────────
  // Uses raw body for HMAC signature verification
  app.post("/api/payment/webhook", express.raw({ type: "application/json" }), handleWebhook);

  // ── Standard middleware ──
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(ensureCsrfCookie);
  app.use(mongoSanitize());
  app.use(attachRequestContext);
  app.use(passport.initialize());
  app.use(morgan(":request-id :method :url :status :response-time ms - :res[content-length]"));

  // ── Health checks ──
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "mane-bazar-api",
      requestId: req.requestId,
      ts: new Date().toISOString()
    });
  });

  app.get("/api/ready", (req, res) => {
    const db = getDbHealth();
    const isReady = db.readyState === 1;

    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "not_ready",
      service: "mane-bazar-api",
      requestId: req.requestId,
      uptimeSeconds: Number(process.uptime().toFixed(0)),
      db,
      ts: new Date().toISOString()
    });
  });

  // ── API routes ──
  app.use("/api", requireCsrfForUnsafeMethods);
  app.use("/api", globalApiRateLimiter);
  app.use("/api/auth",       authRateLimiter, require("./routes/authRoutes"));
  app.use("/api/products",                    require("./routes/productRoutes"));
  app.use("/api/stores",                      require("./routes/storeRoutes"));
  app.use("/api/categories",                  require("./routes/categoryRoutes"));
  app.use("/api/coupons",                     require("./routes/couponRoutes"));
  app.use("/api/orders",                      require("./routes/orderRoutes"));
  app.use("/api/payment",                     require("./routes/paymentRoutes"));
  app.use("/api/admin",                       require("./routes/adminRoutes"));

  // NOTE: /invoices static route has been REMOVED for security.
  // Invoice downloads are now served via the protected /api/orders/:orderId/invoice endpoint.

  // ── Error handling ──
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

// ─── Start ────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    validateRuntimeConfig();
    await connectDB();
    await initEmailService();

    if (process.env.NODE_ENV !== "production") {
      await ensureSeeded();
    }

    const app = createApp();
    const PORT = Number(process.env.PORT) || 5000;
    const runtimeConfig = getRuntimeConfig();

    let isRunningPendingSweep = false;
    const pendingSweepInterval = setInterval(async () => {
      if (isRunningPendingSweep) return;
      isRunningPendingSweep = true;

      try {
        const result = await cleanupExpiredPendingOrders({
          limit: runtimeConfig.pendingPaymentSweepBatchSize
        });

        if (result.cleaned > 0 || result.failed > 0) {
          console.log(
            `[pending-payment-cleanup] scanned=${result.scanned} cleaned=${result.cleaned} failed=${result.failed}`
          );
        }
      } catch (error) {
        console.error("[pending-payment-cleanup] run failed:", error.message);
      } finally {
        isRunningPendingSweep = false;
      }
    }, runtimeConfig.pendingPaymentSweepIntervalMs);

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });

    const shutdown = (signal) => async () => {
      console.log(`${signal} received — shutting down gracefully...`);
      clearInterval(pendingSweepInterval);

      server.close(async () => {
        try {
          await shutdownEmailService();
          await disconnectDB();
        } catch (error) {
          console.error("Error during DB shutdown:", error.message);
        }
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown("SIGTERM"));
    process.on("SIGINT",  shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Unable to start server:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

startServer();
