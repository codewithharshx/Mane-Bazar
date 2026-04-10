# 🚀 Mane Bazar — Quick Start Guide

**Get Mane Bazar up and running in 5 minutes**

---

## Fastest Setup (Windows)

### 1️⃣ Clone and Setup

```bash
git clone https://github.com/codewithharshx/mane-bazar
cd mane-bazar
run.bat
```

This automatically installs dependencies for both frontend and backend.

### 2️⃣ Start Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server: http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Frontend: http://localhost:5173
```

### 3️⃣ Test It

- Open http://localhost:5173
- Try registering or logging in
- Test adding products to cart
- Browse admin dashboard (use admin@manebazar.com / Admin@123)

✅ **Done!** You now have Mane Bazar running locally.

---

## Setup on macOS/Linux

```bash
git clone https://github.com/codewithharshx/mane-bazar
cd mane-bazar

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..

# Start backend
cd server && npm run dev &

# Start frontend
cd client && npm run dev &
```

---

## What Works Out of the Box

✅ **Authentication**
- Register with email/password
- Login with email/password
- Google OAuth login
- JWT token refresh
- Protected routes

✅ **Products**
- 360+ groceries preloaded
- Browse by category
- Search functionality
- Add to cart
- Product details

✅ **Shopping**
- Cart with quantities
- Apply coupon codes
- Add delivery address
- Schedule delivery slot
- Payment with test card

✅ **Admin Dashboard**
- Sales analytics and charts
- Order management
- Product inventory
- User management
- Low stock alerts

✅ **Database**
- MongoDB in-memory (no setup needed)
- Auto-seeded with 12 categories + 360 products
- Admin account ready to use

---

## Useful Commands

### Backend
```bash
cd server

# Development with auto-reload
npm run dev

# Production start
npm start

# Seed database
npm run seed

# Admin CLI
npm run admin -- help
npm run admin -- list-admins
npm run admin -- promote email@example.com
npm run admin -- demote email@example.com
npm run admin -- create email@example.com Password123 "Admin Name"
```

### Frontend
```bash
cd client

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Default Admin Account

Use these to access the admin dashboard:
- **Email**: admin@manebazar.com
- **Password**: Admin@123

⚠️ **CHANGE THIS IMMEDIATELY IN PRODUCTION**

Visit: http://localhost:5173/admin

---

## Test Payment

Use this card to complete payment flow:
- **Number**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date

---

## Environment Variables

These are already set for development:

**Backend** (`server/.env`):
- Uses in-memory MongoDB (no setup needed)
- JWT set to 15-minute expiry
- Frontend URL: http://localhost:5173

**Frontend** (`client/.env.local`):
- API URL: http://localhost:5000/api

All variables are ready for local development. No additional setup required!

---

## Project Structure

```
mane-bazar/
├── server/           # Node.js + Express backend
│   ├── models/       # Database models
│   ├── routes/       # API endpoints
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth, validation, etc.
│   ├── server.js     # Entry point
│   └── .env          # Configuration
│
├── client/           # React + Vite frontend
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/  # Reusable components
│   │   ├── context/  # State management
│   │   └── utils/    # Helpers
│   └── .env.local    # Configuration
```

---

## API Endpoints (Quick Reference)

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/orders` - Manage orders
- `GET /api/admin/products` - Manage products
- `POST /api/admin/products` - Add product
- `PUT /api/admin/products/:id` - Edit product

---

## Troubleshooting

### "Cannot find module"
```bash
cd server && npm install
cd ../client && npm install
```

### "Port already in use"
- Backend: Change `PORT` in server/.env
- Frontend: Use `npm run dev -- --port 3000`

### "CORS error"
- Check backend is running on port 5000
- Check frontend URL in CORS_WHITELIST in server/.env

### "Database connection failed"
- Uses in-memory MongoDB automatically
- No external DB setup required

### "Google OAuth not working"
- Google Client ID is needed (see SETUP_GUIDE.md)
- Works without it (just won't have Google login)

### "Payment not working"
- Uses test mode by default
- Use test card: 4111 1111 1111 1111
- Razorpay keys optional for local testing

---

## Next Steps

1. **Read Full Setup Guide**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Production Checklist**: See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
3. **Configure Google OAuth**: Get free keys for social login
4. **Configure Razorpay**: Get free test keys for payments
5. **Deploy to Production**: Use Vercel (frontend) + Railway (backend)

---

## Need Help?

- 📖 Full docs: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- 🐛 Issues: Create GitHub issue
- 💬 Questions: Check documentation
- 🚀 Deploy: Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) deployment section

---

**You're all set! 🎉**

Enjoy building with Mane Bazar.
