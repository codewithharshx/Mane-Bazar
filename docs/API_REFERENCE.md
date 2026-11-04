# Mane Bazar — REST API Specification & Reference

**Base URL (Development):** `http://localhost:5000/api`  
**Base URL (Production):** `https://api.yourdomain.com/api`  
**Content-Type:** `application/json` (except raw webhooks and PDF streaming)

---

## 1. Common Headers & Authentication

All protected requests require a valid JSON Web Token passed in the standard `Authorization` header:

```http
Authorization: Bearer <jwt-access-token>
```

For state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) submitted by authenticated browser clients using session cookies, the double-submit CSRF cookie token must also be supplied:

```http
x-csrf-token: <value-from-XSRF-TOKEN-cookie>
```

All responses include an audit tracking ID in the response headers and payload:
```http
X-Request-Id: 6a9e1452-f47a-4293-8321-7f9cb8ec081b
```

---

## 2. Health & Diagnostic Endpoints

### 2.1 Service Liveness Check
Returns basic server liveness and timestamp.

```http
GET /api/health
```
- **Auth Required:** No
- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "mane-bazar-api",
  "requestId": "9c12f458-38bb-4c3e-8c88-e04f0521e102",
  "ts": "2026-11-04T10:00:00.000Z"
}
```

### 2.2 Database Readiness Check
Returns database connection status and server uptime. Returns `503 Service Unavailable` if database is disconnected.

```http
GET /api/ready
```
- **Auth Required:** No
- **Response (200 OK):**
```json
{
  "status": "ready",
  "service": "mane-bazar-api",
  "uptimeSeconds": 142,
  "db": {
    "readyState": 1,
    "status": "connected"
  },
  "ts": "2026-11-04T10:00:00.000Z"
}
```

---

## 3. Authentication Endpoints (`/api/auth`)

### 3.1 Register Customer
```http
POST /api/auth/register
```
- **Auth Required:** No
- **Request Body:**
```json
{
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "password": "Password@123",
  "phone": "9876543210"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Verification OTP sent to email.",
  "user": {
    "_id": "6614fa9e2a12bc0012345678",
    "name": "Rohan Sharma",
    "email": "rohan@example.com",
    "role": "customer",
    "isEmailVerified": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3.2 Login with Credentials
```http
POST /api/auth/login
```
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "rohan@example.com",
  "password": "Password@123"
}
```
- **Response (200 OK):** Sets HttpOnly `refreshToken` cookie and returns:
```json
{
  "success": true,
  "user": {
    "_id": "6614fa9e2a12bc0012345678",
    "name": "Rohan Sharma",
    "email": "rohan@example.com",
    "role": "customer",
    "isEmailVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3.3 Verify Email with 6-Digit OTP
```http
POST /api/auth/verify-email-otp
```
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "rohan@example.com",
  "otp": "481920"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully."
}
```

### 3.4 Resend Email OTP
```http
POST /api/auth/resend-verification-otp
```
- **Auth Required:** No (Rate-limited: 60s cooldown, 5 retries/hour)
- **Request Body:** `{"email": "rohan@example.com"}`

### 3.5 Refresh Access Token
```http
POST /api/auth/refresh-token
```
- **Auth Required:** Automatic via HttpOnly `refreshToken` cookie.
- **Response (200 OK):** Returns fresh `accessToken`.

### 3.6 Get Current User Session
```http
GET /api/auth/me
```
- **Auth Required:** Yes (Bearer Token)
- **Response (200 OK):** Sanitized user profile without password or verification tokens.

### 3.7 Logout
```http
POST /api/auth/logout
```
- **Auth Required:** No
- **Response (200 OK):** Clears `refreshToken` cookie.

---

## 4. Product Catalog Endpoints (`/api/products`)

### 4.1 Search & List Products
```http
GET /api/products?page=1&limit=20&category=spices&search=turmeric&sort=price_asc
```
- **Auth Required:** No
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `category` (string, category slug or name)
  - `search` (string, keyword search across title, brand, description)
  - `sort` (`price_asc`, `price_desc`, `rating`, `newest`)
- **Response (200 OK):**
```json
{
  "success": true,
  "products": [
    {
      "_id": "6614fb332a12bc0012345679",
      "name": "Tata Sampann Pure Turmeric Powder",
      "brand": "Tata Sampann",
      "category": "Spices & Masalas",
      "price": 68,
      "mrp": 80,
      "discountPercent": 15,
      "unit": "200g",
      "stock": 45,
      "images": ["https://images.unsplash.com/..."],
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 36,
    "totalPages": 2
  }
}
```

### 4.2 Get Product Details
```http
GET /api/products/:productId
```
- **Auth Required:** No

---

## 5. Kirana Store Endpoints (`/api/stores`)

### 5.1 List Partner Kirana Stores
```http
GET /api/stores
```
- **Auth Required:** No

### 5.2 Verify Delivery Feasibility by Pincode / Coordinates
```http
POST /api/stores/check-delivery
```
- **Request Body:**
```json
{
  "storeId": "6614fb552a12bc0012345680",
  "pincode": "415409",
  "latitude": 17.1350,
  "longitude": 74.2380
}
```
- **Response (200 OK):**
```json
{
  "deliverable": true,
  "distanceKm": 3.4,
  "estimatedDeliveryMinutes": 30,
  "deliveryFee": 20
}
```

---

## 6. Coupon & Discount Endpoints (`/api/coupons`)

### 6.1 Validate Cart Coupon
```http
POST /api/coupons/validate
```
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "code": "MANE10",
  "subtotal": 650
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "coupon": {
    "code": "MANE10",
    "discountType": "percentage",
    "discountValue": 10,
    "discountAmount": 65,
    "finalTotal": 585
  }
}
```

---

## 7. Order Lifecycle Endpoints (`/api/orders`)

### 7.1 Create Order
Executes an atomic stock deduction transaction.
```http
POST /api/orders
```
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "items": [
    {
      "product": "6614fb332a12bc0012345679",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "Main Road, Near Bus Stand",
    "city": "Kasegaon",
    "state": "Maharashtra",
    "pincode": "415409",
    "phone": "9876543210"
  },
  "paymentMethod": "COD",
  "couponCode": "MANE10"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "order": {
    "_id": "6614fc112a12bc0012345685",
    "orderNumber": "MB-20261104-0012",
    "totalAmount": 136,
    "discountAmount": 14,
    "finalAmount": 122,
    "orderStatus": "PLACED",
    "paymentStatus": "PENDING"
  }
}
```

### 7.2 Get Customer Order History
```http
GET /api/orders
```
- **Auth Required:** Yes

### 7.3 Stream Secure PDF Invoice
```http
GET /api/orders/:orderId/invoice
```
- **Auth Required:** Yes (Authenticated customer who owns the order, or Admin)
- **Response:** `200 OK` with binary `Content-Type: application/pdf` and `Content-Disposition: inline; filename="Invoice-MB-20261104-0012.pdf"`.

---

## 8. Payment Gateway Endpoints (`/api/payment`)

### 8.1 Initialize Razorpay Order
```http
POST /api/payment/create-order
```
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "orderId": "6614fc112a12bc0012345685"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "razorpayOrderId": "order_ODw18j7c9Xy1zA",
  "amount": 12200,
  "currency": "INR",
  "keyId": "rzp_test_..."
}
```

### 8.2 Verify Razorpay Signature
```http
POST /api/payment/verify
```
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "razorpay_order_id": "order_ODw18j7c9Xy1zA",
  "razorpay_payment_id": "pay_ODw3X9b7c1K4pL",
  "razorpay_signature": "45b90757d54e81a3e87d46c827365a6f..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment verified and order confirmed successfully."
}
```

### 8.3 Razorpay Webhook Handler
```http
POST /api/payment/webhook
```
- **Auth Required:** HMAC SHA-256 Signature via `x-razorpay-signature` header.
- **Handled Events:** `payment.captured`, `payment.failed`, `refund.processed`.

---

## 9. Merchant Administration Endpoints (`/api/admin`)

*All admin endpoints require `Authorization: Bearer <token>` for a user with `role: "admin"`.*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | High-level metrics: gross revenue, total orders, users, low stock counts. |
| `GET` | `/api/admin/revenue-chart` | Daily / monthly revenue time series data for Recharts visualization. |
| `GET` | `/api/admin/orders` | Paginated listing of all customer orders across the platform. |
| `PUT` | `/api/admin/orders/:id/status` | Advance order status (`CONFIRMED`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`). |
| `POST` | `/api/admin/products` | Add a new grocery product to the catalog. |
| `PUT` | `/api/admin/products/:id` | Update product details, price, or description. |
| `DELETE`| `/api/admin/products/:id` | Soft-delete a product from customer visibility. |
| `PUT` | `/api/admin/inventory/:id` | Inline update of stock quantities. |
| `GET` | `/api/admin/users` | List registered customers and merchants. |
| `PUT` | `/api/admin/users/:id/role`| Update user authorization role (`customer` / `admin`). |
| `GET` | `/api/admin/audit-logs` | Retrieve chronological audit trail of all merchant inventory/order actions. |

---

## 10. Standard Error Response Schema

When an API error occurs, responses conform to this consistent JSON envelope:

```json
{
  "success": false,
  "message": "Invalid credentials provided.",
  "requestId": "9c12f458-38bb-4c3e-8c88-e04f0521e102",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters with 1 number."
    }
  ]
}
```

