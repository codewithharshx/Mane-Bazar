# Mane Bazar — REST API Reference

The Mane Bazar backend provides a structured, versioned REST API. All endpoints are accessible under `/api` (or `/api/v1`).

- **Base URL:** `http://localhost:4000/api`
- **Content-Type:** `application/json`
- **Authentication:** `Bearer <JWT_ACCESS_TOKEN>` or secure HttpOnly session cookies.
- **CSRF Token:** Unsafe methods (`POST`, `PUT`, `DELETE`, `PATCH`) require the `x-csrf-token` header matching the `XSRF-TOKEN` cookie.

---

## 1. System & Health

### Health Check
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "mane-bazar-api",
  "requestId": "c1f77d54-8e3d-4c8d-8a22-49386d7010e1",
  "ts": "2026-11-04T05:30:00.000Z"
}
```

---

## 2. Authentication & Profile (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/register` | None | Register a new customer account |
| `POST` | `/api/auth/login` | None | Authenticate with email & password |
| `POST` | `/api/auth/verify-email` | None | Verify account using 6-digit email OTP |
| `POST` | `/api/auth/resend-verification` | None | Request fresh email verification OTP |
| `POST` | `/api/auth/refresh-token` | Cookie | Exchange refresh token cookie for fresh access token |
| `POST` | `/api/auth/logout` | None | Clear authentication cookies & terminate session |
| `GET` | `/api/auth/me` | Bearer | Get authenticated user profile & addresses |
| `PUT` | `/api/auth/profile` | Bearer | Update customer name / phone |
| `POST` | `/api/auth/addresses` | Bearer | Add a delivery address |
| `PUT` | `/api/auth/addresses/:id` | Bearer | Update an existing delivery address |
| `DELETE` | `/api/auth/addresses/:id` | Bearer | Remove a delivery address |
| `POST` | `/api/auth/request-password-reset` | None | Send password reset link to user email |
| `POST` | `/api/auth/reset-password` | None | Reset password with token |

---

## 3. Products & Catalog (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/products` | None | Search & list products (supports `search`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`) |
| `GET` | `/api/products/:slug` | None | Retrieve single product details by slug |
| `GET` | `/api/products/category/:slug` | None | Retrieve all products under category slug |
| `POST` | `/api/products` | Admin | Create a new grocery SKU (Title, Brand, Price, MRP, Stock, Images) |
| `PUT` | `/api/products/:id` | Admin | Update product details or adjust inventory |
| `DELETE` | `/api/products/:id` | Admin | Delete product from catalog |
| `POST` | `/api/products/:id/reviews` | Bearer | Submit customer product rating & review |

---

## 4. Grocery Categories (`/api/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/categories` | None | List all 12 Indian grocery categories |
| `GET` | `/api/categories/:slug` | None | Retrieve category details and banner assets |

---

## 5. Partner Kirana Stores (`/api/stores`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/stores` | None | List partner kirana stores |
| `GET` | `/api/stores/nearby` | None | Find nearby stores within delivery radius (`lat`, `lng`, `radiusKm`) |
| `GET` | `/api/stores/:storeId` | None | Get store details and operational hours |
| `GET` | `/api/stores/:storeId/products` | None | Get catalog specific to a kirana merchant |
| `POST` | `/api/stores` | Admin | Register new merchant store |
| `PUT` | `/api/stores/:storeId` | Admin | Update store details or operational status |
| `DELETE` | `/api/stores/:storeId` | Admin | Remove store |

---

## 6. Promotional Coupons (`/api/coupons`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/coupons` | None | List active public promotional discount coupons |
| `POST` | `/api/coupons/validate` | Bearer | Validate coupon code against cart total |
| `POST` | `/api/coupons` | Admin | Create new promotional coupon |
| `PUT` | `/api/coupons/:id` | Admin | Update coupon validity and thresholds |
| `DELETE` | `/api/coupons/:id` | Admin | Deactivate or delete coupon |

---

## 7. Orders & Checkout (`/api/orders`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/orders/cod` | Bearer | Place Cash on Delivery order with atomic stock decrement |
| `GET` | `/api/orders/my-orders` | Bearer | List order history for authenticated customer |
| `GET` | `/api/orders/:orderId` | Bearer | Get detailed tracking status for an order |
| `GET` | `/api/orders/:orderId/invoice` | Bearer | Download generated PDF invoice for order |
| `PUT` | `/api/orders/:orderId/cancel` | Bearer | Cancel order (restores reserved inventory) |
| `PUT` | `/api/orders/:orderId/status` | Admin | Progress order state (`CONFIRMED`, `PACKED`, `DELIVERED`, etc.) |

---

## 8. Payments & Webhooks (`/api/payment`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/payment/create-order` | Bearer | Create Razorpay order with server-calculated amount |
| `POST` | `/api/payment/verify` | Bearer | Verify HMAC SHA-256 signature and finalize order |
| `POST` | `/api/payment/payment-failed` | Bearer | Record payment failure and release reserved stock |
| `POST` | `/api/payment/invoice` | Bearer | Request on-demand invoice generation |
| `POST` | `/api/payment/webhook` | Raw Body | Razorpay webhook listener for payment capture events |

---

## 9. Merchant Administration (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/admin/metrics` | Admin | Revenue totals, order counts, and low-inventory alerts |
| `GET` | `/api/admin/users` | Admin | List registered platform users |
| `PUT` | `/api/admin/users/:id/role` | Admin | Promote or demote user RBAC roles (`USER`, `ADMIN`) |
| `GET` | `/api/admin/audit-logs` | Admin | View immutable security audit trail of admin actions |
