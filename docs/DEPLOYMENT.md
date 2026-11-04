# Mane Bazar — Production Deployment Guide

This guide outlines deployment procedures for releasing **Mane Bazar** to production across cloud platforms, including MongoDB Atlas configuration, SSL domains, OAuth redirects, and payment gateways.

---

## 1. Architecture Deployment Overview

```
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│     Frontend (Vercel / Netlify) │      │     Backend (Railway / Render)  │
│     https://manebazar.com       │◄────►│     https://api.manebazar.com   │
└─────────────────────────────────┘      └────────────────┬────────────────┘
                                                          │ Mongoose
                                                          ▼
                                         ┌─────────────────────────────────┐
                                         │       MongoDB Atlas Cluster     │
                                         │       (AWS / Mumbai Region)     │
                                         └─────────────────────────────────┘
```

---

## 2. Database Setup (MongoDB Atlas)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (select an Indian region such as `ap-south-1 Mumbai` for low kirana network latency).
3. **Database Access:** Create a database user with read/write permissions on the `mane-bazar` database.
4. **Network Access:** Add your backend server's IP address (or `0.0.0.0/0` if deploying to serverless/container hosts like Railway or Render).
5. Copy the standard connection string:
   ```text
   your_mongodb_atlas_connection_string
   ```

---

## 3. Backend Deployment (Render / Railway / VPS)

### Option A: Railway or Render Container
1. Connect your GitHub repository `Mane-Bazar`.
2. Configure root directory / subfolder: `server`.
3. Set **Build Command:** `npm ci`
4. Set **Start Command:** `npm start`
5. Configure Environment Variables in the service settings:

```env
NODE_ENV=production
PORT=5000
MONGODB_MEMORY_SERVER=false
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_cryptographically_secure_random_string_32_chars_min
JWT_REFRESH_SECRET=use_a_second_cryptographically_secure_random_string
CLIENT_URL=https://manebazar.com
CORS_WHITELIST=https://manebazar.com,https://www.manebazar.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_CALLBACK_URL=https://api.manebazar.com/api/auth/google/callback
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=orders@manebazar.com
ADMIN_EMAIL=admin@manebazar.com
```

### Option B: Linux VPS (Ubuntu / Debian) with PM2 & Nginx
1. Clone the repository and install dependencies:
   ```bash
   cd /var/www/mane-bazar/server
   npm ci --omit=dev
   ```
2. Start the application using PM2 process manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "mane-bazar-api"
   pm2 startup
   pm2 save
   ```
3. Configure Nginx reverse proxy with Certbot SSL:
   ```nginx
   server {
       server_name api.manebazar.com;
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 4. Frontend Deployment (Vercel / Netlify)

### On Vercel
1. Import your GitHub repository `Mane-Bazar`.
2. Configure **Root Directory:** `client`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add Environment Variables:
   - `VITE_API_URL`: `https://api.manebazar.com/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_live_your_actual_key_id`
   - `VITE_GOOGLE_CLIENT_ID`: `your-production-google-client-id.apps.googleusercontent.com`
7. Click **Deploy**.

---

## 5. External Service Production Configurations

### 5.1 Google Cloud Console OAuth
1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your OAuth 2.0 Web Client ID.
3. Add **Authorized JavaScript Origins:**
   - `https://manebazar.com`
4. Add **Authorized Redirect URIs:**
   - `https://api.manebazar.com/api/auth/google/callback`

### 5.2 Razorpay Production Gateway
1. Complete KYC in the [Razorpay Dashboard](https://dashboard.razorpay.com/) to activate Live Mode.
2. Generate Live API Keys (`rzp_live_...`).
3. Set Webhook URL:
   - URL: `https://api.manebazar.com/api/payment/webhook`
   - Secret: Configure a secret matching `RAZORPAY_WEBHOOK_SECRET`.
   - Active Events: `payment.captured`, `payment.failed`, `refund.processed`.

---

## 6. Post-Deployment Verification

1. Ping API health:
   ```bash
   curl -I https://api.manebazar.com/api/health
   ```
2. Ping database readiness:
   ```bash
   curl https://api.manebazar.com/api/ready
   ```
3. Test customer registration and complete a live test transaction.
4. Verify SSL certificate grade (A+) on [Qualys SSL Labs](https://www.ssllabs.com/ssltest/).
