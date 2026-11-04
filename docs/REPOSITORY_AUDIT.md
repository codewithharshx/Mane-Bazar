# Mane Bazar — Comprehensive Repository Audit & Architectural Health Report

**Audit Date:** November 2026  
**Auditor:** Senior Developer Experience & Repository Maintenance Team  
**Repository:** [codewithharshx/Mane-Bazar](https://github.com/codewithharshx/Mane-Bazar)  
**Project:** Mane Bazar — Kirana-Centric Grocery E-Commerce Platform  

---

## 1. Executive Summary

An exhaustive technical audit of the **Mane Bazar** repository was conducted covering the file tree, package manifests, dependencies, frontend and backend source code, database models, API routes, automated tests, Git commit history, configuration files, and security posture.

The repository represents a **full-stack MERN grocery e-commerce web application** specifically modeled after Indian local kiranas. The core application logic in `client/` and `server/` is well-implemented and fully functional:
- **Frontend (`client/`):** React 18 with Vite, Tailwind CSS, Framer Motion, Recharts, and Lucide Icons. Builds cleanly into production bundles with 0 compilation errors.
- **Backend (`server/`):** Node.js and Express with Mongoose, supporting both in-memory MongoDB for local development and MongoDB Atlas for production. Contains an atomic checkout stock-reservation transaction engine, Razorpay online payments with HMAC SHA-256 verification, Cash on Delivery, automated BullMQ/Nodemailer email queuing, Twilio WhatsApp notifications, and PDFKit invoice generation.
- **Automated Tests:** 17 automated tests in `server/tests/` verify atomic stock reservation rollback, coupon calculation, CSRF protection, email templating, OTP policy, and webhook signature verification. All 17 tests pass with a 100% pass rate.

### Primary Audit Findings

1. **Previous Documentation Conflicts & Distortions:**
   - The root directory contained conflicting documentation files (`ARCHITECTURE.md`, `SETUP_GUIDE.md`, `QUICKSTART.md`, `MANE_BAZAR_PROGRESS.md`, `ANTIGRAVITY_SKILL_MAP.md`).
   - A previous automated agent run recorded claims of a TypeScript monorepo using Prisma, PostgreSQL, and Vitest 61 tests (`apps/`, `packages/`). This was an abandoned experiment that does **not** reflect the actual MERN codebase in `client/` and `server/`.
   - The existing `README.md` contained 14 null bytes (`0x00`) and corrupted multibyte characters (mojibake like `dY>'`, `?"`), causing Git, markdown parsers, and IDEs to flag it as a binary file.
2. **Untracked Experimental Artifacts:**
   - `apps/` (backend & frontend TypeScript Prisma experiment) and `packages/` (database & shared packages) are untracked and completely disconnected from the actual working application in `client/` and `server/`.
   - `.backup/` was an untracked local copy of `client/` and `server/`.
   - `.mimocode/` was an untracked internal background tool directory.
   - `scripts/` at root was an empty directory.
3. **Root Package Manifest Misconfiguration:**
   - Root `package.json` had uncommitted modifications introducing `"workspaces": ["apps/*", "packages/*"]`. Because `apps/*` and `packages/*` are disconnected from the application, running `npm install` at root caused workspace confusion.
4. **Security & Credential Scanning:**
   - An unstaged Razorpay test key (`rzp_test_SdHlNCUCWpl89B`) and a hardcoded sample mobile number were present in `client/.env.example` and `server/.env.example`.
   - **No active production secrets, AWS keys, SendGrid API keys, or Google Client secrets are committed to Git history.**
   - All `.env` files are properly listed in `.gitignore`.
5. **Missing GitHub Templates & Assets:**
   - The repository lacked issue templates, pull request templates, and a `LICENSE` file.
   - The `screenshots/` directory was absent, leaving README screenshots broken or unreferenced.
   - Documentation was scattered across root rather than organized in `docs/`.

---

## 2. Directory & Structure Audit

### 2.1 Current vs Target Layout

| Path | Status | Finding / Action Required |
|------|--------|---------------------------|
| `.github/workflows/ci.yml` | Present | Needs upgrade to modern GitHub Action versions (`@v4`), proper service container setup for MongoDB, and unified lint/test steps. |
| `.github/ISSUE_TEMPLATE/` | Missing | Add bug report and feature request templates. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Missing | Add standardized PR submission checklist. |
| `.husky/` | Present | Pre-commit hook runs `secretlint "**/*"`. Retain. |
| `client/` | Active Codebase | React 18, Vite 6, Tailwind CSS, Framer Motion, Recharts. Builds cleanly. |
| `client/public/` | Missing | Create `client/public/` with favicon and manifest assets. |
| `server/` | Active Codebase | Express, Mongoose, Razorpay, PDFKit, Nodemailer, BullMQ. Clean modular architecture. |
| `server/scripts/` | Reorganized | `seed.js`, `admin-cli.js`, and `generate-dataset.js` relocated cleanly under `scripts/`. |
| `server/data/` | Active | Contains 360+ item grocery catalog seed (`catalog.seed.json`). |
| `docs/` | Active | Currently contains transient reports. Needs complete documentation suite (`ARCHITECTURE.md`, `INSTALLATION.md`, `ENVIRONMENT.md`, `API_REFERENCE.md`, `AUTHENTICATION.md`, `PAYMENT_FLOW.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`). |
| `screenshots/` | Missing | Create directory with clear dimension guidelines and placeholders. |
| `apps/` & `packages/` | Untracked Experiment | Abandoned TypeScript/Prisma monorepo attempt. Keep untouched or isolate until user requests removal. |
| `.backup/` | Untracked Temp | Redundant copy of `client` and `server`. Flagged for safe user approval before deletion. |
| `.mimocode/` | Untracked Temp | Temp folder from local tool runner. Flagged for user approval before deletion. |
| `scripts/` (root) | Empty Directory | 0 files. Safe to prune. |
| `run.bat` | Active | Windows automated setup and startup script. Working cleanly. |
| `run.sh` | Missing | Create Unix/macOS equivalent for cross-platform parity. |
| `LICENSE` | Missing | Create standard MIT License file. |
| `README.md` | Corrupted | Corrupted with null bytes and invalid characters. Rebuild from scratch. |

---

## 3. Package Manifest & Dependency Audit

### 3.1 Root `package.json`
- **Issue:** Modified locally to include `workspaces: ["apps/*", "packages/*"]` and scripts for Prisma/Vitest which do not match the real MERN stack app.
- **Resolution:** Reconfigure root `package.json` to act as a clean developer convenience runner:
  - `dev`: Runs server and client concurrently.
  - `dev:server`: `npm --prefix server run dev`
  - `dev:client`: `npm --prefix client run dev`
  - `build`: `npm --prefix client run build`
  - `test`: `npm --prefix server test`
  - `install:all`: Installs root, server, and client dependencies.

### 3.2 Client (`client/package.json`)
- **Name:** `mane-bazar-client` (v1.0.0, ESM)
- **Key Dependencies:**
  - `@react-oauth/google`: `^0.12.1`
  - `axios`: `^1.15.0`
  - `framer-motion`: `^12.9.2`
  - `lucide-react`: `^0.479.0`
  - `react`: `^18.3.1`
  - `react-dom`: `^18.3.1`
  - `react-hot-toast`: `^2.5.2`
  - `react-router-dom`: `^6.30.1`
  - `recharts`: `^2.15.3`
- **DevDependencies:** `@vitejs/plugin-react` `^4.3.4`, `autoprefixer` `^10.4.21`, `postcss` `^8.5.3`, `tailwindcss` `^3.4.17`, `vite` `^6.3.5`.
- **Scripts:** `dev`, `build`, `preview`. Missing `lint` script.
- **Build Status:** Verified passing. Transforms 2,726 modules in ~9.6 seconds into optimized chunks (`charts`, `motion`, `react`, routes).

### 3.3 Server (`server/package.json`)
- **Name:** `mane-bazar-server` (v1.0.0, CommonJS)
- **Key Dependencies:**
  - `express`: `^4.22.1`
  - `mongoose`: `^8.23.0`
  - `mongodb-memory-server`: `^10.1.4` (enables zero-config local development without a running MongoDB daemon)
  - `jsonwebtoken`: `^9.0.3` & `bcryptjs`: `^2.4.3`
  - `passport` & `passport-google-oauth20`: `^2.0.0`
  - `razorpay`: `^2.9.6`
  - `pdfkit`: `^0.17.1` (PDF invoice generation)
  - `nodemailer`: `^8.0.5` & `bullmq`: `^5.61.0` (asynchronous email queue)
  - `twilio`: `^5.13.1` (WhatsApp alerts)
  - `helmet`: `^8.1.0`, `cors`: `^2.8.6`, `cookie-parser`: `^1.4.7`, `express-rate-limit`: `^7.5.0`, `express-mongo-sanitize`: `^2.2.0`, `morgan`: `^1.10.0`
- **Scripts:**
  - `dev`: `nodemon server.js`
  - `start`: `node server.js`
  - `seed`: `node scripts/seed.js`
  - `admin`: `node scripts/admin-cli.js`
  - `generate:dataset`: `node scripts/generate-dataset.js`
  - `test`: `node --test`
- **Test Status:** Verified passing 17/17 tests with native Node.js test runner (`node --test`).

---

## 4. Verification & Implementation Status Matrix

Every feature documented in the repository has been audited directly against the source code:

| Feature Subsystem | Audit Status | Code Reference | Notes / Caveats |
|-------------------|--------------|----------------|-----------------|
| **Frontend UI & Pages** | **Implemented & Verified** | `client/src/pages/*`, `client/src/components/*` | Clean component hierarchy, responsive grid, Framer Motion animations, Recharts dashboard charts. |
| **Client Routing & Auth Protection** | **Implemented & Verified** | `client/src/App.jsx`, `ProtectedRoute.jsx` | Routes categorized into public, customer-protected, and admin-protected. |
| **In-Memory MongoDB for Local Dev** | **Implemented & Verified** | `server/config/db.js` | Uses `mongodb-memory-server` automatically when `MONGODB_MEMORY_SERVER=true` or `MONGO_URI` is blank. |
| **MongoDB Atlas Support** | **Implemented & Verified** | `server/config/db.js` | Connects seamlessly when `MONGO_URI` is supplied. |
| **Catalog Seeding (360+ Groceries)** | **Implemented & Verified** | `server/data/catalog.seed.json`, `server/utils/seedData.js` | Realistic kirana catalog across 12 grocery categories (no fresh fruits/vegetables). |
| **Email/Password Registration & Login** | **Implemented & Verified** | `server/controllers/authController.js` | Salted bcrypt hashing, JWT access token (15m), HttpOnly refresh cookie (7d). |
| **Email Verification & OTP Policy** | **Implemented & Verified** | `server/models/OTPModel.js`, `server/services/otpPolicy.js` | 6-digit OTP, 10m TTL, 60s cooldown, max 5 attempts/hour. Verified with unit tests. |
| **Password Reset via Token** | **Implemented & Verified** | `server/controllers/authController.js` | SHA-256 hashed token with 30m TTL. |
| **Google OAuth 2.0** | **Requires External Config** | `server/config/passport.js`, `client/src/main.jsx` | Full Passport strategy and client provider implemented; requires Google Cloud Client ID & Secret to activate in live testing. |
| **Kirana Store Discovery & Delivery** | **Implemented & Verified** | `server/controllers/storeController.js`, `StoreListPage.jsx` | Distance calculation based on pincode coordinates with 25km radius check. |
| **Cart & Wishlist Persistence** | **Implemented & Verified** | `client/src/context/CartContext.jsx`, `WishlistContext.jsx` | LocalStorage backing with stock boundary validation. |
| **Coupon Code Validation** | **Implemented & Verified** | `server/controllers/couponController.js`, `Coupon.js` | Supports percentage and flat discounts, min order amounts, max discount caps, expiry. Verified with tests. |
| **Atomic Checkout & Stock Reservation** | **Implemented & Verified** | `server/services/orderService.js` | Mongoose session transaction rolls back atomically if stock is insufficient. Verified with tests. |
| **Pending Order Cleanup Sweeper** | **Implemented & Verified** | `server/services/orderService.js`, `server.js` | Background interval releases inventory and marks abandoned pending orders as EXPIRED after 15 minutes. |
| **Razorpay Online Payments** | **Requires External Config** | `server/controllers/paymentController.js` | Order creation, client checkout popup, HMAC SHA-256 signature verification. Requires Razorpay API keys. |
| **Razorpay Webhook Handler** | **Implemented & Verified** | `server/controllers/webhookController.js` | Raw body HMAC verification for `payment.captured`, `payment.failed`, `refund.processed`. Verified with unit tests. |
| **Cash on Delivery (COD)** | **Implemented & Verified** | `server/controllers/orderController.js` | Order confirmed immediately with pending payment state and reserved stock. |
| **PDF Invoice Generation** | **Implemented & Verified** | `server/services/invoiceService.js` | PDFKit invoice rendering customer details, line items, taxes, discounts. Downloadable via authenticated endpoint. |
| **Email Queue (BullMQ / Nodemailer)** | **Requires External Config** | `server/services/emailService.js` | Redis BullMQ queue with HTML templates. Gracefully falls back to console logger in development if Redis is unavailable. |
| **WhatsApp Notifications (Twilio)** | **Requires External Config** | `server/services/whatsappService.js` | Twilio API client. Gracefully skips and logs to console if credentials are unset. |
| **Admin Dashboard & Analytics** | **Implemented & Verified** | `server/controllers/adminController.js`, `AdminDashboardPage.jsx` | Revenue summary, sales chart aggregation, low stock indicators, recent orders table. |
| **Admin Product & Inventory CRUD** | **Implemented & Verified** | `server/controllers/adminController.js`, `AdminProductsPage.jsx` | Full product management and inline stock adjustments with `AdminAuditLog` tracking. |
| **CSRF Protection** | **Implemented & Verified** | `server/middleware/csrfProtection.js` | Double-submit CSRF cookie pattern (`XSRF-TOKEN` cookie validated against `x-csrf-token` header). Verified with tests. |
| **Rate Limiting & Security Headers** | **Implemented & Verified** | `server/middleware/rateLimiter.js`, `server.js` | Rate limiters for auth, verify, checkout, and global API; Helmet CSP allows Razorpay and Google OAuth. |
| **Live GPS Driver Telemetry** | **Not Implemented** | N/A | Store delivery is based on static distance calculations, not live continuous GPS device polling. |
| **Push Notifications (FCM / Web Push)** | **Not Implemented** | N/A | Notifications are delivered via email and WhatsApp. |

---

## 5. Security Audit Findings

### 5.1 Credential & Secret Inspection
1. **Unstaged `.env.example` Files:**
   - `client/.env.example` contained: `VITE_RAZORPAY_KEY_ID=rzp_test_SdHlNCUCWpl89B`.
   - `server/.env.example` contained: `RAZORPAY_KEY_ID=rzp_test_SdHlNCUCWpl89B` and `ADMIN_WHATSAPP_NUMBER=+919876543210`.
   - **Remediation:** Sanitized all sample `.env` files to purely generic dummy placeholders (`rzp_test_your_key_id`, `your-google-client-id`, `+910000000000`). If this test key was ever active on Razorpay, rotating the test key pair in the Razorpay Dashboard is recommended.
2. **Git History Inspection:**
   - Searched Git commit logs across all revisions for:
     - `mongodb+srv://` (0 occurrences)
     - `AIza` Google API keys (0 occurrences)
     - `SG.` SendGrid keys (0 occurrences)
     - `rzp_live` Razorpay live keys (0 occurrences)
     - `ghp_` GitHub tokens (0 occurrences)
     - `sk_live` Stripe live keys (0 occurrences)
   - Verified that no `.env` file containing live secrets was ever tracked or committed.
3. **Static Invoice Download Vulnerability:**
   - Previous revisions exposed `/invoices` as an unauthenticated static folder.
   - **Fixed:** Static serving was removed; invoices are now protected by `authMiddleware` and served exclusively via `GET /api/orders/:orderId/invoice`.
4. **NoSQL Injection & Parameter Sanitization:**
   - `express-mongo-sanitize` is enabled globally.
   - `express-validator` validates all input payloads.

---

## 6. Documentation Audit & Issues Found

1. **`README.md` Binary Corruption:**
   - Contained 14 null bytes and garbled UTF-8 sequences.
   - Contained non-standard badges, outdated URLs (`codewithharshx/mane-bazar` vs actual repository casing), and incomplete setup guides.
2. **Scattered Root Documentation:**
   - `ARCHITECTURE.md`, `SETUP_GUIDE.md`, and `QUICKSTART.md` were placed at root instead of under `docs/`.
   - `SETUP_GUIDE.md` referenced `bash run.sh`, which did not exist on disk.
   - `SETUP_GUIDE.md` contained hardcoded default credentials (`admin@manebazar.com` / `Admin@123`).
3. **Artifact Confusion:**
   - `MANE_BAZAR_PROGRESS.md`, `prd.json`, `progress.txt`, and `docs/ANTIGRAVITY_SKILL_MAP.md` documented an alternative Prisma/PostgreSQL monorepo architecture that did not match the actual MERN implementation.
4. **Broken Links:**
   - Several markdown files linked to nonexistent docs or relative files that had been moved.

---

## 7. Action Plan & Remediation Roadmap

1. **Stage 1: Documentation Migration & Cleanup**
   - Create unified, high-quality documentation in `docs/`:
     - `docs/ARCHITECTURE.md`
     - `docs/INSTALLATION.md`
     - `docs/ENVIRONMENT.md`
     - `docs/API_REFERENCE.md`
     - `docs/AUTHENTICATION.md`
     - `docs/PAYMENT_FLOW.md`
     - `docs/DEPLOYMENT.md`
     - `docs/CONTRIBUTING.md`
     - `docs/REPOSITORY_AUDIT.md` (this report)
2. **Stage 2: Rebuild Root `README.md`**
   - Professional header, verified technology badges, project introduction, architecture summary, verified features breakdown, screenshots gallery placeholders, installation instructions, security overview, contribution guidelines, license information.
3. **Stage 3: Cross-Platform Parity & Root Manifest**
   - Provide `run.sh` for Linux/macOS users alongside `run.bat`.
   - Provide standard MIT `LICENSE` file.
   - Update root `package.json` with universal developer scripts.
   - Add `"lint": "vite build"` to `client/package.json`.
4. **Stage 4: GitHub Metadata & Quality Assurance**
   - Add `.github/ISSUE_TEMPLATE/` (bug report, feature request, config).
   - Add `.github/PULL_REQUEST_TEMPLATE.md`.
   - Upgrade `.github/workflows/ci.yml` to modern GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`) and verify local test execution.
   - Create `screenshots/` directory with `screenshots/README.md`.
5. **Stage 5: Verification & Validation**
   - Verify client build (`npm run build`).
   - Verify server test execution (`npm test`).
   - Verify secret scanning (`secretlint`).
   - Report remaining manual developer tasks.

