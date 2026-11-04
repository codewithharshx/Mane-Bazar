# Mane Bazar — Production Deployment Guide

This guide outlines deployment procedures for releasing **Mane Bazar** to production across cloud environments, including PostgreSQL hosting, SSL certificates, OAuth redirects, and Razorpay production keys.

---

## 1. Production Architecture Overview

```
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│   Frontend (Vercel / Netlify)   │      │    Backend (Railway / Render)   │
│      https://manebazar.com      │◄────►│    https://api.manebazar.com    │
└─────────────────────────────────┘      └────────────────┬────────────────┘
                                                          │ Prisma Client (SSL)
                                                          ▼
                                         ┌─────────────────────────────────┐
                                         │       PostgreSQL Database       │
                                         │   (AWS RDS / Neon / Railway)    │
                                         └─────────────────────────────────┘
```

---

## 2. PostgreSQL Database Setup (Cloud Hosting)

Mane Bazar requires **PostgreSQL**. Choose a managed cloud PostgreSQL provider:

- **AWS RDS:** Engine: PostgreSQL 16+, region `ap-south-1` (Mumbai) for low latency across Indian merchants.
- **Neon / Railway / Render / Supabase:** Managed serverless or containerized PostgreSQL instance.

### A. Connection String Configuration
Your production `DATABASE_URL` should look like:
```ini
DATABASE_URL="postgresql://db_user:db_password@db_host.region.rds.amazonaws.com:5432/mane_bazar?schema=public&sslmode=require"
```

### B. Applying Migrations in Production
Before starting the backend, apply database migrations using Prisma's production command:
```bash
npx prisma migrate deploy
```
This safely applies all pending version-controlled migrations without resetting or dropping existing data.

---

## 3. Backend API Deployment (Railway / Render / Docker)

### Option A: Railway or Render Deployment
1. Connect your GitHub repository: `https://github.com/codewithharshx/Mane-Bazar`.
2. Configure **Root Directory:** `apps/backend` (or monorepo root).
3. **Build Command:**
   ```bash
   npm run build:shared && npm run build:database && npm run build:backend
   ```
4. **Pre-Deploy Command (Migrations):**
   ```bash
   npm --workspace=packages/database run prisma:migrate
   ```
5. **Start Command:**
   ```bash
   node apps/backend/dist/server.js
   ```

### Option B: Production Environment Variables

Configure these variables in your hosting provider's dashboard:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/mane_bazar?schema=public&sslmode=require
JWT_SECRET=production_random_secret_minimum_64_hex_characters
JWT_REFRESH_SECRET=production_random_refresh_secret_minimum_64_hex_characters
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=https://manebazar.com
CORS_WHITELIST=https://manebazar.com,https://www.manebazar.com
COOKIE_DOMAIN=manebazar.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.manebazar.com/api/auth/google/callback
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_live_secret
RAZORPAY_WEBHOOK_SECRET=your_actual_live_webhook_secret
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_or_ses_api_key
EMAIL_FROM="Mane Bazar <orders@manebazar.com>"
ADMIN_EMAIL=admin@manebazar.com
```

---

## 4. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)

1. Connect your GitHub repository to Vercel or Netlify.
2. Configure project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Configure Environment Variables:
   ```env
   VITE_API_URL=https://api.manebazar.com/api
   VITE_RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Configure SPA routing rewrites:
   - For Vercel, ensure `vercel.json` rewrites all routes to `/index.html`:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```

---

## 5. Post-Deployment Verification

1. **API Health Check:** Send a request to `https://api.manebazar.com/api/health` and verify HTTP 200 with `{ "status": "ok" }`.
2. **Product Catalog:** Verify `https://api.manebazar.com/api/products` returns seeded grocery items.
3. **SSL Validation:** Confirm HTTPS padlock appears for both `manebazar.com` and `api.manebazar.com`.
4. **Razorpay Webhooks:** Set up your webhook URL in Razorpay Dashboard pointing to `https://api.manebazar.com/api/payment/webhook` with events `payment.captured`, `payment.failed`, and `refund.processed`.
