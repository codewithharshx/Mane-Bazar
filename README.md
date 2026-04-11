# 🛒 Mane Bazar — Grocery E-Commerce Platform

**A production-ready, full-stack grocery e-commerce web application modeled after local Indian kiranas.** Built with MERN stack, Razorpay payments, PDF invoice generation, and comprehensive admin dashboard.

[![GitHub](https://img.shields.io/badge/GitHub-codewithharshx%2Fmane--bazar-blue?logo=github)](https://github.com/codewithharshx/mane-bazar)
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)]()

---

## ⚡ Quick Start

Get up and running in 5 minutes:

```bash
git clone https://github.com/codewithharshx/mane-bazar
cd mane-bazar
run.bat              # Windows
# or for macOS/Linux: cd server && npm install && cd ../client && npm install

# Terminal 1
cd server && npm run dev    # Backend: http://localhost:5000

# Terminal 2
cd client && npm run dev    # Frontend: http://localhost:5173
```

👉 **For detailed setup guide**: See [QUICKSTART.md](./QUICKSTART.md)

---

## ✨ Features

| Feature | Status | Details |
|---------|--------|---------|
| **Authentication** | ✅ | JWT + Google OAuth |
| **User Registration** | ✅ | Email & password with validation |
| **Login System** | ✅ | Email/password + Google OAuth |
| **Token Refresh** | ✅ | Auto refresh with secure cookies |
| **Role-Based Access** | ✅ | User / Admin roles with protected routes |
| **Product Catalog** | ✅ | 360+ groceries pre-seeded |
| **Search & Filter** | ✅ | By category, brand, price |
| **Shopping Cart** | ✅ | Add/remove items, adjust quantities |
| **Wishlist** | ✅ | Persistent localStorage |
| **Coupon System** | ✅ | Apply discount codes |
| **Checkout Flow** | ✅ | Address, delivery slot, payment method |
| **Razorpay Integration** | ✅ | Online payments + testing |
| **Cash on Delivery** | ✅ | Alternative payment method |
| **Order Management** | ✅ | Track status, view history |
| **Order Tracking** | ✅ | Real-time status updates |
| **PDF Invoices** | ✅ | Auto-generated with order details |
| **Admin Dashboard** | ✅ | Analytics & management |
| **Sales Analytics** | ✅ | Revenue, orders, charts |
| **Order Management** (Admin) | ✅ | View, filter, update status |
| **Product Management** (Admin) | ✅ | Add, edit, delete, inventory |
| **User Management** (Admin) | ✅ | Promote/demote admin roles |
| **Inventory Alerts** | ✅ | Low stock warnings |
| **Store Listing** | ✅ | Multiple stores with geolocation |
| **Growth Charts** | ✅ | Monthly user & revenue trends |
| **In-Memory Database** | ✅ | MongoDB Memory Server (dev) |
| **Production Ready** | ✅ | MongoDB Atlas support |

---

## 🧱 Architecture

### Tech Stack

**Frontend:**
- React 18.3 with Vite
- Tailwind CSS for styling
- Framer Motion for animations
- React Router v6 for navigation
- Axios for API calls
- Google OAuth integration
- Recharts for analytics

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Google OAuth with Passport
- Razorpay payment integration
- In-memory MongoDB for dev

**Utilities:**
- Bcryptjs for password hashing
- PDFKit for invoice generation
- Express-validator for input validation
- Rate limiting for security
- Helmet for security headers

### Folder Structure

```
mane-bazar/
├── client/                      # React frontend (port 5173)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext, CartContext, WishlistContext
│   │   ├── pages/              # Page components (20+ pages)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Helpers, formatters, API calls
│   │   └── assets/             # Images, icons
│   ├── .env.local              # Frontend config
│   └── package.json
│
├── server/                      # Express backend (port 5000)
│   ├── config/                 # DB, Passport config
│   ├── controllers/            # Business logic (8 controllers)
│   ├── models/                 # MongoDB models (7 models)
│   ├── routes/                 # API routes (8 route files)
│   ├── middleware/             # Auth, validation, error handling
│   ├── services/               # Utilities (invoice, payment)
│   ├── utils/                  # Helpers
│   ├── admin-cli.js            # Admin management CLI
│   ├── server.js               # Entry point
│   ├── .env                    # Backend config
│   └── package.json
│
├── QUICKSTART.md               # 5-minute setup guide
├── SETUP_GUIDE.md              # Comprehensive setup guide
├── PRODUCTION_CHECKLIST.md     # Pre-launch checklist
└── README.md                   # This file
```

---

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup & deployment guide
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Production readiness checklist

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ ([Download](https://nodejs.org/))
- npm v9+ (comes with Node.js)
- Git ([Download](https://git-scm.com/))

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/codewithharshx/mane-bazar
   cd mane-bazar
   ```

2. **Install Dependencies**
   ```bash
   # Windows
   run.bat
   
   # macOS/Linux
   cd server && npm install && cd ../client && npm install && cd ..
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   cd client
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - Admin Dashboard: http://localhost:5173/admin

### Default Admin Account
- **Email**: admin@manebazar.com
- **Password**: Admin@123

⚠️ **Change this immediately in production**

---

## 🔧 Configuration

### Backend Environment (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_MEMORY_SERVER=true
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
CLIENT_URL=http://localhost:5173
```

### Frontend Environment (.env.local)

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-id
VITE_RAZORPAY_KEY_ID=your-razorpay-key
```

👉 See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete configuration

---

## 🛠️ Admin CLI

Manage admins from command line:

```bash
cd server

# List all admins
npm run admin -- list-admins

# Promote user to admin
npm run admin -- promote email@example.com

# Demote admin to user
npm run admin -- demote email@example.com

# Create new admin
npm run admin -- create email@example.com Password123 "Admin Name"

# Reset password
npm run admin -- reset-password email@example.com NewPassword123
```

---

## 📊 API Documentation

### Auth Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Service Health
- `GET /api/health` - Liveness probe (process is running)
- `GET /api/ready` - Readiness probe (returns 200 only when DB is connected)

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `GET /api/categories` - List categories

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - User orders
- `GET /api/orders/:id` - Order details

### Idempotency For Checkout
- Use header `x-idempotency-key` on checkout/payment write requests.
- Reusing the same key with the same payload safely replays the previous result.
- Reusing the same key with a different payload returns `409`.

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/orders` - Manage orders
- `GET /api/admin/products` - Manage products

👉 Full API docs in [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 🧪 Testing

### Test Payment Card (Development)
- **Number**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Health Check
```bash
curl http://localhost:5000/api/health
```

---

## 🐛 Troubleshooting

### CORS Error
- Ensure backend is on port 5000
- Verify `CLIENT_URL` in server/.env

### Database Connection Failed
- Uses in-memory MongoDB automatically
- No external setup needed for development

### Cannot Find Module
```bash
cd server && npm install
cd ../client && npm install
```

👉 More troubleshooting in [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting)

---

## 🚀 Deployment

### Quick Deploy Options

**Frontend (Vercel)**
- Push to GitHub
- Connect to Vercel
- Auto-deploys on push

**Backend (Railway/Heroku)**
- Connect GitHub repo  
- Set environment variables
- Deploy

👉 Detailed deployment in [SETUP_GUIDE.md](./SETUP_GUIDE.md#production-deployment)

---

## 📋 Project Status

- ✅ Core features complete
- ✅ Admin dashboard fully functional
- ✅ Payment integration ready
- ✅ Database auto-seeding
- ✅ Validation & error handling
- ✅ Security middleware implemented
- ⏳ Some advanced features (real-time notifications)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👨‍💻 Author

**Harsh Kumar** - [@codewithharshx](https://github.com/codewithharshx)

---

## 🙏 Acknowledgments

- MongoDB for flexible database
- Express for backend framework
- React team for frontend library
- Razorpay for payment processing
- All open-source contributors

---

## 📧 Support

- 📖 **Documentation**: Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🐛 **Issues**: Create [GitHub Issue](https://github.com/codewithharshx/mane-bazar/issues)
- 💬 **Questions**: Check documentation
- 🚀 **Deploy**: Follow deployment section

---

**⭐ If this project helped you, please give it a star!**

Happy coding! 🎉

---

## 🧱 Project Structure

```text
mane-bazar/
├── client/                  # React + Tailwind frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # AuthContext, CartContext, WishlistContext
│   │   ├── hooks/           # useGeolocation, useLocalStorage
│   │   ├── pages/           # All page components
│   │   └── utils/           # api.js, formatters.js, constants.js
│   └── .env                 # VITE_API_URL, VITE_RAZORPAY_KEY_ID, ...
│
├── server/                  # Node.js + Express backend
│   ├── config/              # db.js, passport.js
│   ├── controllers/         # Auth, Product, Order, Payment, Admin...
│   ├── middleware/           # auth, error, rate limiter, async handler
│   ├── models/              # User, Product, Order, Store, Category...
│   ├── routes/              # All Express routers
│   ├── services/            # invoiceService, paymentService
│   ├── utils/               # seedData, tokens, order helpers
│   └── .env                 # PORT, MONGO_URI, JWT_SECRET, ...
│
├── run.bat                  # One-click Windows startup script
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- (Optional) MongoDB Atlas account for production

### 1. Clone & Install

```bash
# Windows — just double-click run.bat
# Or manually:
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables

**`server/.env`** — copy from `.env.example`:

```env
PORT=5000
NODE_ENV=development

# MongoDB — leave as-is to use in-memory DB for dev
USE_MEMORY_DB=true
MONGO_URI=your_mongodb_connection_string

# JWT (change these in production!)
JWT_SECRET=change_me_in_production_32chars
JWT_REFRESH_SECRET=change_me_refresh_32chars

# Razorpay (get from https://razorpay.com/docs/api/)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Google OAuth (optional — for Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# CORS
CLIENT_URL=http://localhost:5173
CORS_WHITELIST=http://localhost:5173,http://127.0.0.1:5173
COOKIE_DOMAIN=localhost
```

**`client/.env`**:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run Development Servers

**Easiest (Windows)**:

```text
Double-click run.bat
```

**Manual**:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- **Backend**: <http://localhost:5000>
- **Frontend**: <http://localhost:5173>
- **API Health**: <http://localhost:5000/api/health>

---

## 👤 Default Admin Account

When the database is seeded automatically, an admin account is created:

```text
Email:    admin@manebazar.in
Password: Admin@123
```

> ⚠️ Change this password immediately in any non-development environment.

---

## 🔑 API Reference

### Auth

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/google` | Public | Google login (ID token) |
| POST | `/api/auth/refresh-token` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Cookie | Logout + clear cookie |
| GET | `/api/auth/me` | Bearer | Get current user |
| PUT | `/api/auth/profile` | Bearer | Update profile |
| POST | `/api/auth/addresses` | Bearer | Add address |
| PUT | `/api/auth/addresses/:id` | Bearer | Update address |
| DELETE | `/api/auth/addresses/:id` | Bearer | Delete address |

### Products

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/products` | Public | List with search/filter/pagination |
| GET | `/api/products/:slug` | Public | Product detail |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Orders

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/orders/cod` | Bearer | Place COD order |
| GET | `/api/orders/mine` | Bearer | My orders |
| GET | `/api/orders/:orderId` | Bearer | Order detail |
| PUT | `/api/orders/:orderId/status` | Admin | Update order status |
| POST | `/api/orders/:orderId/cancel` | Bearer | Cancel order |
| GET | `/api/orders/:orderId/invoice` | Bearer | Download invoice PDF |

### Payment (Razorpay)

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/payment/create-order` | Bearer | Create Razorpay order |
| POST | `/api/payment/verify` | Bearer | Verify and confirm payment |

### Admin

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/admin/dashboard` | Admin | Full analytics data |
| GET | `/api/admin/orders` | Admin | All orders (search/filter/paginate) |
| GET | `/api/admin/users` | Admin | All users (search/filter/paginate) |
| PATCH | `/api/admin/users/:id/role` | Admin | Change user role |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/inventory` | Admin | Low stock alerts |
| PATCH | `/api/admin/inventory/:id/restock` | Admin | Restock product |

---

## 💳 Payment Flow

1. **Razorpay** — Frontend calls `POST /api/payment/create-order` → opens Razorpay checkout → on success calls `POST /api/payment/verify` → order saved + invoice generated.
2. **COD** — Frontend calls `POST /api/orders/cod` → order saved immediately with `paymentStatus: "pending"` → set to `"paid"` when delivered.

---

## 🗄️ Database

The app uses **in-memory MongoDB** by default for local development (no Atlas setup needed). On first startup, it auto-seeds with:

- 10+ grocery categories
- 300+ real grocery products with Indian brand names and cloud image URLs
- 5 store locations
- 1 admin user

To use a real MongoDB Atlas cluster, set `USE_MEMORY_DB=false` and configure `MONGO_URI` in `server/.env`.

---

## 🏗️ Production Deployment

1. Set `NODE_ENV=production` in server environment
2. Configure real `MONGO_URI` (Atlas or self-hosted)
3. Generate secure 32+ char secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
4. Configure real Razorpay production keys
5. Build frontend: `cd client && npm run build`
6. Serve `client/dist` as static files or deploy to Vercel/Netlify
7. Deploy server to Railway, Render, or any Node.js host

---

## 🛡️ Security Features

- **Helmet** — HTTP security headers
- **Rate limiting** — 20 auth requests per 15 minutes
- **MongoDB sanitization** — prevents NoSQL injection
- **Bcrypt** — password hashing (12 salt rounds)
- **JWT** — short-lived access tokens (15m) + long-lived refresh tokens (7d) via HttpOnly cookies
- **CORS** — whitelist-based origin control
- **Role-based access control** — user / admin roles enforced on every protected route

---
Updated for CodeRabbit test

## 📜 License

MIT — built by the Mane Bazar development team.
