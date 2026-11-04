# Mane Bazar — System Architecture & Design Overview

This document describes the architectural layout, subsystem responsibilities, data flow, and runtime mechanics of the **Mane Bazar** grocery e-commerce platform.

---

## 1. System Overview

Mane Bazar is engineered as an enterprise-grade, high-performance TypeScript monorepo designed specifically to bridge local Indian grocery merchants (*kiranas*) with modern digital consumers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Browser                                │
│           (React 18 + Vite + Tailwind CSS + TanStack Query)            │
│                        http://localhost:5173                            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST API (JSON)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Express.js Gateway & Server                        │
│                        http://localhost:4000                            │
│                                                                         │
│  [Security & Middleware Pipeline]                                       │
│  ├── Helmet (CSP, FrameGuard)         ├── CSRF Protection (XSRF-TOKEN)  │
│  ├── CORS (Origin whitelist)          ├── Global & Route Rate Limiters  │
│  ├── Morgan + UUID Request Tracking   ├── Zod Request Body Validation   │
│                                                                         │
│  [API Routing Layer]                                                    │
│  ├── /api/auth       (Registration, Login, OTP Verification, Google)    │
│  ├── /api/products   (Catalog discovery, Search, Filters, Stock)        │
│  ├── /api/stores     (Kirana partner discovery & Delivery radius)       │
│  ├── /api/categories (Product taxonomy classification)                  │
│  ├── /api/coupons    (Discount engine & Cart coupon validation)         │
│  ├── /api/orders     (Atomic order placement & PDF invoice streaming)   │
│  ├── /api/payment    (Razorpay orders, Webhooks, HMAC verification)     │
│  └── /api/admin      (RBAC Dashboard, Inventory, Metrics, Audit logs)   │
└────────────────────┬───────────────────────────────────┬────────────────┘
                     │ Prisma ORM (Type-Safe SQL)         │ External APIs
                     ▼                                   ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────┐
│       Database Layer (PostgreSQL)    │  │       External Services       │
│  ├── Relational Schema & Constraints │  │  ├── Razorpay (Payment Gateway│
│  ├── Prisma Client Connection Pool   │  │  ├── Google OAuth 2.0 (Auth)  │
│  ├── ACID Transaction Isolation      │  │  ├── Nodemailer (SMTP Email)  │
│  └── Atomic Inventory Decrement      │  │  └── BullMQ / Redis (Queues)  │
└──────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 2. Monorepo Organization

The project is structured as an npm workspaces monorepo:

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
├── .github/                   # Workflows & Issue Templates
└── package.json               # Monorepo workspace root orchestrator
```

---

## 3. Database Architecture (PostgreSQL & Prisma)

PostgreSQL is the mandatory and only application database for Mane Bazar. All access is mediated through Prisma ORM with strict relational constraints, foreign keys, and indexes.

### Core Data Models

| Model | Table | Responsibility | Key Relations |
|-------|-------|----------------|---------------|
| `User` | `users` | Customers & Admin accounts | Addresses, Orders, Reviews, Cart |
| `Address` | `addresses` | Customer delivery addresses | Belongs to `User` |
| `Category` | `categories` | Grocery taxonomy (12 staple categories) | Has many `Product` |
| `Store` | `stores` | Neighborhood kirana merchant profiles | Has many `Product`, Reviews, Orders |
| `Product` | `products` | Indian grocery SKU catalog with stock | Belongs to `Category`, `Store` |
| `ProductImage` | `product_images` | High-res product showcase gallery | Belongs to `Product` |
| `Review` | `reviews` | Customer product reviews & ratings | Belongs to `User`, `Product` |
| `CartItem` | `cart_items` | Customer cart state | Belongs to `User`, `Product` |
| `Order` | `orders` | Completed & in-flight customer orders | Has many `OrderItem`, `Payment` |
| `OrderItem` | `order_items` | Immutable snapshot of purchased item & price | Belongs to `Order`, `Product` |
| `Coupon` | `coupons` | Rupee / percentage promotional discounts | Used by `Order` |
| `Payment` | `payments` | Razorpay / COD transaction status | Belongs to `Order` |
| `AdminAuditLog`| `admin_audit_logs` | Security audit trail for admin actions | Belongs to `User` (Admin) |
| `IdempotencyKey`| `idempotency_keys` | Duplicate checkout request prevention | Scoped by key & user |

### Transaction Safety & Concurrency

- **Atomic Stock Reservation:** Order placement runs within a PostgreSQL transaction (`prisma.$transaction`). Stock quantities are validated and decremented atomically, guaranteeing zero overselling during flash checkout spikes.
- **Pending Order Cleanup Sweeper:** An automated background job scans for abandoned `PENDING_PAYMENT` orders older than 15 minutes, restores reserved inventory, and marks orders as `CANCELLED`.
- **Connection Pooling:** Prisma Client manages connection pooling to PostgreSQL, automatically scaling across high-traffic API bursts.

---

## 4. Security & Authentication Architecture

1. **Password Security:** Salted Bcrypt hashing with a work factor of 12 rounds.
2. **JWT Dual-Token Rotation:**
   - **Access Token:** Short-lived (15 minutes), signed with `JWT_SECRET`.
   - **Refresh Token:** Long-lived (7 days), stored in a secure `HttpOnly`, `SameSite=Lax` cookie, signed with `JWT_REFRESH_SECRET`.
3. **Double-Submit CSRF Defense:**
   - Server sets an `XSRF-TOKEN` cookie.
   - Client sends the token back in the `x-csrf-token` header for all state-mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`).
4. **Google OAuth 2.0:** Secure Passport Google strategy with token serialization and automated account profile matching.
5. **Rate Limiting:** IP-based windowed rate limits applied to auth endpoints (20 req / 15 min), checkouts (25 req / 10 min), and global API requests (250 req / 15 min).
6. **Payment Integrity:** Razorpay webhooks and client signatures verified using cryptographic HMAC SHA-256 (`crypto.timingSafeEqual`).
