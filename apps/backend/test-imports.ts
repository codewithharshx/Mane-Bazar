// Test imports one by one to find the crash
async function testImports() {
  const imports = [
    ["dotenv", () => import("dotenv")],
    ["express", () => import("express")],
    ["cors", () => import("cors")],
    ["helmet", () => import("helmet")],
    ["morgan", () => import("morgan")],
    ["passport", () => import("passport")],
    ["cookie-parser", () => import("cookie-parser")],
    ["@mane-bazar/database", () => import("@mane-bazar/database")],
    ["@mane-bazar/shared", () => import("@mane-bazar/shared")],
    ["config/env", () => import("./src/config/env.js")],
    ["config/passport", () => import("./src/config/passport.js")],
    ["middleware/errorMiddleware", () => import("./src/presentation/middleware/errorMiddleware.js")],
    ["middleware/requestContext", () => import("./src/presentation/middleware/requestContext.js")],
    ["middleware/csrfProtection", () => import("./src/presentation/middleware/csrfProtection.js")],
    ["middleware/rateLimiter", () => import("./src/presentation/middleware/rateLimiter.js")],
    ["middleware/asyncHandler", () => import("./src/presentation/middleware/asyncHandler.js")],
    ["middleware/authMiddleware", () => import("./src/presentation/middleware/authMiddleware.js")],
    ["middleware/validateRequest", () => import("./src/presentation/middleware/validateRequest.js")],
    ["services/emailService", () => import("./src/infrastructure/services/emailService.js")],
    ["services/invoiceService", () => import("./src/infrastructure/services/invoiceService.js")],
    ["services/whatsappService", () => import("./src/infrastructure/services/whatsappService.js")],
    ["services/idempotencyService", () => import("./src/infrastructure/services/idempotencyService.js")],
    ["services/paymentService", () => import("./src/infrastructure/services/paymentService.js")],
    ["services/orderService", () => import("./src/infrastructure/services/orderService.js")],
    ["services/adminAuditService", () => import("./src/infrastructure/services/adminAuditService.js")],
    ["utils/order", () => import("./src/utils/order.js")],
    ["utils/tokens", () => import("./src/utils/tokens.js")],
    ["utils/generateOTP", () => import("./src/utils/generateOTP.js")],
    ["routes/authRoutes", () => import("./src/presentation/routes/authRoutes.js")],
    ["routes/categoryRoutes", () => import("./src/presentation/routes/categoryRoutes.js")],
    ["routes/productRoutes", () => import("./src/presentation/routes/productRoutes.js")],
    ["routes/storeRoutes", () => import("./src/presentation/routes/storeRoutes.js")],
    ["routes/couponRoutes", () => import("./src/presentation/routes/couponRoutes.js")],
    ["routes/orderRoutes", () => import("./src/presentation/routes/orderRoutes.js")],
    ["routes/paymentRoutes", () => import("./src/presentation/routes/paymentRoutes.js")],
    ["routes/adminRoutes", () => import("./src/presentation/routes/adminRoutes.js")],
    ["routes/webhookRoutes", () => import("./src/presentation/routes/webhookRoutes.js")],
    ["controllers/webhookController", () => import("./src/presentation/controllers/webhookController.js")],
    ["controllers/categoryController", () => import("./src/presentation/controllers/categoryController.js")],
    ["controllers/productController", () => import("./src/presentation/controllers/productController.js")],
    ["controllers/storeController", () => import("./src/presentation/controllers/storeController.js")],
    ["controllers/couponController", () => import("./src/presentation/controllers/couponController.js")],
    ["controllers/orderController", () => import("./src/presentation/controllers/orderController.js")],
    ["controllers/paymentController", () => import("./src/presentation/controllers/paymentController.js")],
    ["controllers/adminController", () => import("./src/presentation/controllers/adminController.js")],
  ];

  for (const [name, fn] of imports) {
    try {
      await fn();
      console.log(`✅ ${name}`);
    } catch (e: any) {
      console.error(`❌ ${name}: ${e.message}`);
      console.error(e.stack);
      break;
    }
  }
}

testImports();
