<div align="center">

# 🛒 Mane Bazar

**Enterprise-Grade Grocery E-Commerce Monorepo Platform for Indian Kiranas**

[![CI Status](https://img.shields.io/github/actions/workflow/status/codewithharshx/Mane-Bazar/ci.yml?branch=main&style=flat-square&logo=github-actions&logoColor=white)](https://github.com/codewithharshx/Mane-Bazar/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%20|%20v20%20|%20v22-green.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20|%2018-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20UPI%20%7C%20COD-02042B.svg?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Vitest](https://img.shields.io/badge/Tests-61%20Passed-FCC72B.svg?style=flat-square&logo=vitest&logoColor=black)](apps/backend/src/)

[Explore Documentation](docs/) • [System Architecture](docs/ARCHITECTURE.md) • [REST API Reference](docs/API_REFERENCE.md) • [Local Installation](docs/INSTALLATION.md) • [Environment Guide](docs/ENVIRONMENT.md) • [Report Bug](https://github.com/codewithharshx/Mane-Bazar/issues)

</div>

---

## 📖 Introduction

**Mane Bazar** is a full-stack e-commerce web platform engineered to bridge local neighborhood grocery stores (*kiranas*) with digital-first consumers.

In the Indian retail landscape, independent kirana merchants face aggressive competition from centralized quick-commerce aggregators while managing complex inventory, fragmented suppliers, and restrictive catalog systems. Mane Bazar solves this by offering a lightweight, merchant-first commerce platform that delivers:

- **Hyperlocal Kirana Discovery:** Connects customers with partner neighborhood kiranas based on pincode and delivery radius.
- **Relational Integrity with PostgreSQL & Prisma:** Strict ACID transaction isolation, version-controlled SQL migrations, relational foreign keys, and performant indexes.
- **Server-Authoritative Pricing & Totals:** Completely eliminates client-side price tampering by calculating product totals, delivery fees, taxes, and coupon discounts exclusively on the backend.
- **Atomic Stock Reservation:** Concurrent checkout isolation powered by interactive PostgreSQL transactions (`prisma.$transaction`) prevents overselling during high-traffic spikes, supported by an automatic 15-minute pending order cleanup sweeper.
- **Comprehensive Indian Payment Ecosystem:** Seamless integration with Razorpay supporting UPI (Google Pay, PhonePe, Paytm), Netbanking, Debit/Credit Cards, and Cash on Delivery (COD).

---

## 📸 Application Previews

> [!NOTE]
> High-resolution interface captures can be placed in [`screenshots/`](screenshots/). See [`screenshots/README.md`](screenshots/README.md) for capture guidelines.

<div align="center">

| 🏪 Storefront & Discovery | 📦 Product Catalog & Filters |
|:---:|:---:|
| ![Homepage Preview](screenshots/homepage.png)<br><sub>*Storefront banner, categories & promotional strips*</sub> | ![Products Preview](screenshots/products.png)<br><sub>*Faceted category search, price sorting & badges*</sub> |

| 🛒 Shopping Cart & Discounts | 💳 Secure Checkout & Payments |
|:---:|:---:|
| ![Cart Preview](screenshots/cart.png)<br><sub>*Slide-over drawer, quantity limits & coupon engine*</sub> | ![Checkout Preview](screenshots/checkout.png)<br><sub>*Saved addresses, Razorpay UPI & Cash on Delivery*</sub> |

| 📊 Merchant Analytics Dashboard | 📱 Mobile Responsive Experience |
|:---:|:---:|
| ![Admin Dashboard](screenshots/admin-dashboard.png)<br><sub>*Revenue curves, order status & inventory alerts*</sub> | ![Mobile View](screenshots/mobile-view.png)<br><sub>*Touch-optimized bottom navigation & quick cart*</sub> |

</div>

---

## 🚀 Verified Feature Matrix

Every capability listed below is fully implemented and verified in the codebase:

### 🛍️ Customer Experience
- **Responsive Kirana UI:** Built with React 18, Tailwind CSS, Framer Motion animations, and touch-friendly mobile drawers.
- **Structured Grocery Categories:** 12 Indian staple categories (Rice & Grains, Atta & Flour, Pulses & Dal, Cooking Oil & Ghee, Spices & Masala, Packaged Foods, Snacks & Biscuits, Beverages, Dairy Products, Dry Fruits & Nuts, Household Essentials, Personal Care).
- **Persistent Wishlist & Cart:** TanStack Query and React Context synchronization with local storage persistence across sessions.

### 🔐 Authentication & Session Security
- **Email & Password Authentication:** Passwords hashed with salted Bcrypt (12 rounds).
- **OTP Email Verification:** Cryptographic 6-digit numeric OTP with 10-minute validity, 60-second resend cooldown, and hourly attempt caps.
- **Google OAuth 2.0:** Secure Passport Google strategy with automated profile matching and account linking.
- **JWT Dual-Token Rotation:** Short-lived access token (15m) paired with secure `HttpOnly`, `SameSite=Lax` refresh cookie (7d).
- **Double-Submit CSRF Protection:** Cryptographic `XSRF-TOKEN` cookie validated against `x-csrf-token` header on all mutating requests.

### 🔍 Product Discovery & Store Range
- **Instant Search & Filtering:** Case-insensitive search across titles, brands, tags, and descriptions.
- **Store Distance Verification:** Validates customer address against store delivery eligibility radius.
- **Pre-Seeded Kirana Catalog:** Over 360 authentic Indian grocery SKUs with MRPs, selling prices, and pack units.

### 💰 Pricing, Coupons & Checkout
- **Server-Authoritative Totals:** Strict monetary calculation protecting against client tampering.
- **Flexible Coupon Engine:** Supports flat rupee and percentage discounts, minimum cart value thresholds, and usage limits.
- **Atomic Stock Reservation:** PostgreSQL transaction decrements inventory when an order is created, rolling back cleanly if stock is insufficient.
- **Background Stock Sweeper:** Periodic background worker restores reserved inventory for abandoned checkouts after 15 minutes.

### 💳 Payments & Invoicing
- **Razorpay Online Payments:** Server-side order creation supporting UPI, Cards, and Netbanking.
- **HMAC SHA-256 Verification:** `crypto.timingSafeEqual` signature verification guarding against payment tampering.
- **Webhook Reconciliation:** Raw body webhook listener processing `payment.captured`, `payment.failed`, and `refund.processed`.
- **Cash on Delivery (COD):** Seamless COD workflow with pending payment status tracking.
- **PDF Invoice Generation:** Secure on-the-fly PDF invoice streaming using PDFKit for authenticated order owners.

### 📦 Merchant Dashboard & Operations
- **Real-Time Analytics:** Visual revenue charts and order status distribution powered by Recharts.
- **Product & Inventory Management:** Inline stock editing and product CRUD with `AdminAuditLog` tracking.
- **Order State Machine:** Merchant workflow tracking order progression: `PLACED` → `CONFIRMED` → `PACKED` → `OUT_FOR_DELIVERY` → `DELIVERED`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend Web App** | React 18, Vite 6, TypeScript, Tailwind CSS, TanStack Query, Framer Motion, Lucide Icons, Recharts |
| **Backend REST API** | Node.js 20+, Express 4, TypeScript, Zod, Helmet, Morgan, Cookie-Parser, Passport.js |
| **Database & ORM** | PostgreSQL (v14+), Prisma ORM (v5.22), Version-Controlled SQL Migrations |
| **Authentication** | JWT (Dual Access/Refresh Rotation), Bcrypt.js (12 rounds), Google OAuth 2.0 |
| **Payments** | Razorpay SDK (UPI, Netbanking, Cards), Webhooks with HMAC SHA-256, Cash on Delivery |
| **Transactional Email**| Nodemailer, BullMQ, Redis (optional queue) |
| **Document Generation**| PDFKit (Server-Side Streaming PDF Invoices) |
| **Testing & Quality** | Vitest (61 Unit & Integration Tests), TypeScript Strict Checking (`tsc --noEmit`), SecretLint |

---

## 🏗️ Monorepo Architecture

Mane Bazar is structured as an npm workspaces monorepo:

```
mane-bazar/
├── apps/
│   ├── backend/               # Express + TypeScript REST API (Port 4000)
│   │   ├── src/
│   │   │   ├── config/        # Environment, Passport, Runtime config
│   │   │   ├── domain/        # Domain entities & interfaces
│   │   │   ├── infrastructure/# Database singleton, Email, Invoices
│   │   │   ├── presentation/  # Controllers, Routes, Middleware
│   │   │   └── server.ts      # Server bootstrap & lifecycle
│   │   └── package.json
│   │
│   └── frontend/              # Vite + React 18 SPA (Port 5173)
│       ├── src/
│       │   ├── components/    # Reusable UI widgets & Navbar
│       │   ├── context/       # Auth, Cart, Wishlist context providers
│       │   ├── hooks/         # Custom React hooks (debounce, query)
│       │   ├── pages/         # Storefront & Admin dashboard views
│       │   ├── services/      # Typed API clients (Axios)
│       │   └── main.tsx       # App bootstrap & routing
│       └── package.json
│
├── packages/
│   ├── database/              # PostgreSQL Prisma Schema & Migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # PostgreSQL schema definitions
│   │   │   ├── migrations/    # Version-controlled SQL migrations
│   │   │   └── seed.ts        # Database seed runner
│   │   ├── data/              # 360+ Indian grocery seed catalog
│   │   └── package.json
│   │
│   └── shared/                # Cross-cutting TypeScript types & Zod schemas
│       ├── src/
│       │   ├── schemas/       # Request validation schemas
│       │   ├── types/         # Domain models & API contracts
│       │   └── index.ts
│       └── package.json
│
├── docs/                      # Architectural & Operational Documentation
├── screenshots/               # Verified UI Captures
├── .github/                   # CI Workflows & Issue Templates
└── package.json               # Monorepo workspace root orchestrator
```

---

## ⚡ Quickstart & Installation

### Prerequisites

- **Node.js:** `v18.20.0` or higher (`v20.x` recommended)
- **PostgreSQL:** `v14` or higher (tested on PostgreSQL 16 & 18)
- **npm:** `v9.x` or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/codewithharshx/Mane-Bazar.git
cd Mane-Bazar
npm install
```

### 2. Configure Environment

Copy the example configuration files:

```bash
# Windows
copy apps\backend\.env.example apps\backend\.env
copy packages\database\.env.example packages\database\.env
copy apps\frontend\.env.example apps\frontend\.env

# macOS / Linux
cp apps/backend/.env.example apps/backend/.env
cp packages/database/.env.example packages/database/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Ensure `DATABASE_URL` in `packages/database/.env` and `apps/backend/.env` points to your PostgreSQL database:
```ini
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/mane_bazar?schema=public"
```

### 3. Run Migrations & Seed Database

Apply Prisma schema migrations to PostgreSQL and seed initial categories, coupons, and products:

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start the Application

#### Option A: One-Click Startup Script

- **Windows:** Double-click `run.bat` or run:
  ```cmd
  run.bat
  ```
- **macOS / Linux:** Run:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

#### Option B: npm Dev Command

```bash
npm run dev
```

- **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)
- **API Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 🔑 Default Credentials

When seeded, the following demo accounts are available:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@manebazar.com` | `Admin@123` | Merchant Dashboard, Product CRUD, Stock Alerts, Audit Logs |
| **Customer** | `user@manebazar.com` | `User@123` | Storefront Shopping, Cart, Checkout, Order Tracking |

> [!WARNING]
> Change default credentials immediately before deploying to any production or publicly accessible environment.

---

## 📡 REST API Reference Summary

All API endpoints are prefixed with `/api` (or `/api/v1`):

| Scope | Method | Endpoint | Description |
|-------|--------|----------|-------------|
| **Health** | `GET` | `/api/health` | Service uptime and request tracing |
| **Auth** | `POST` | `/api/auth/register` | Customer account registration |
| **Auth** | `POST` | `/api/auth/login` | Email and password authentication |
| **Auth** | `POST` | `/api/auth/verify-email` | Verify 6-digit email OTP |
| **Auth** | `POST` | `/api/auth/refresh-token` | Rotate JWT access token |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Catalog** | `GET` | `/api/products` | Search & filter grocery catalog |
| **Catalog** | `GET` | `/api/products/:slug` | Product detail by slug |
| **Categories** | `GET` | `/api/categories` | List 12 staple grocery categories |
| **Stores** | `GET` | `/api/stores/nearby` | Find partner kiranas within radius |
| **Coupons** | `POST` | `/api/coupons/validate` | Validate promotional discount coupon |
| **Orders** | `POST` | `/api/orders/cod` | Place Cash on Delivery order |
| **Orders** | `GET` | `/api/orders/my-orders` | Customer order history |
| **Orders** | `GET` | `/api/orders/:orderId/invoice` | Stream PDF invoice |
| **Payments** | `POST` | `/api/payment/create-order` | Create Razorpay order |
| **Payments** | `POST` | `/api/payment/verify` | Verify HMAC payment signature |
| **Payments** | `POST` | `/api/payment/webhook` | Razorpay webhook listener |
| **Admin** | `GET` | `/api/admin/metrics` | Merchant revenue & order metrics |

👉 **For complete request schemas, query parameters, and responses**: See [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

---

## 🛡️ Security & Quality Standards

- **PostgreSQL Transaction Safety:** Orders and stock updates are wrapped in ACID transactions (`prisma.$transaction`) to eliminate overselling and race conditions.
- **Strict TypeScript:** All packages compile with `tsc --noEmit` with zero type errors.
- **Dual-Token JWT Rotation:** 15-minute access token in memory, 7-day secure HttpOnly refresh cookie.
- **Double-Submit CSRF Protection:** `XSRF-TOKEN` cookie validated on all mutating HTTP requests.
- **HTTP Security Headers:** Powered by `helmet` with strict Content Security Policy (CSP).
- **Automated Secret Scanning:** Verified with `secretlint` across all commits.

---

## 🤝 Contributing

We welcome contributions to Mane Bazar! Please follow our [Contributing Guidelines](docs/CONTRIBUTING.md):

1. Fork the repository and create a feature branch (`git checkout -b feat/your-feature`).
2. Verify code quality:
   ```bash
   npm run lint        # TypeScript check across workspaces
   npm test            # Run Vitest test suite
   npm run build       # Verify production builds
   npx secretlint "**/*"
   ```
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).
4. Open a Pull Request using our [PR Template](.github/PULL_REQUEST_TEMPLATE.md).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
