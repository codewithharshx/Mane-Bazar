# Mane Bazar — Environment Configuration Reference

This guide details all environment variables across the **frontend (`client/`)** and **backend (`server/`)** applications, including security best practices and production guidelines.

---

## 1. Frontend Environment Variables (`client/.env.local`)

Frontend variables must be prefixed with `VITE_` to be bundled by Vite into the client application.

> [!CAUTION]
> All variables prefixed with `VITE_` are exposed publicly in client-side JavaScript bundles. **Never store private keys, secrets, or database passwords in frontend `.env` files.**

| Variable Name | Required? | Default / Example Value | Description |
|---------------|-----------|-------------------------|-------------|
| `VITE_API_URL` | **Yes** | `http://localhost:5000/api` | Base HTTP endpoint of the backend Express API server. In production, set to your production API domain (e.g., `https://api.manebazar.com/api`). |
| `VITE_RAZORPAY_KEY_ID` | Optional | `rzp_test_your_razorpay_key_id` | Razorpay public Key ID used by the client-side checkout modal. Obtain from your Razorpay Dashboard. |
| `VITE_GOOGLE_CLIENT_ID` | Optional | `your-google-client-id.apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID for initializing the `@react-oauth/google` provider. |

---

## 2. Backend Environment Variables (`server/.env`)

The backend reads environment variables on startup via `dotenv` and validates critical settings in `server/config/env.js`.

### 2.1 Core Server & Network Settings

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `PORT` | Optional | `5000` | HTTP port on which the Express server listens. |
| `NODE_ENV` | Optional | `development` | Environment mode (`development`, `test`, or `production`). |
| `CLIENT_URL` | Optional | `http://localhost:5173` | Canonical URL of the frontend SPA. Used for OAuth redirects and CORS policy. |
| `CORS_WHITELIST` | Optional | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000` | Comma-separated list of origins allowed to make cross-origin requests. |

### 2.2 Database Configuration

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `MONGODB_MEMORY_SERVER` | Optional | `true` (in dev) | When `true`, automatically spawns an in-memory MongoDB replica set. Set to `false` in production. |
| `MONGO_URI` | **Yes in Prod** | *(empty in dev)* | MongoDB connection URI string (e.g. your MongoDB Atlas cluster connection URI). |

### 2.3 Authentication & JWT Tokens

> [!IMPORTANT]
> In production, `JWT_SECRET` and `JWT_REFRESH_SECRET` must be distinct, cryptographically strong random strings of at least 32 characters. Generate using:  
> `openssl rand -base64 32`

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `JWT_SECRET` | **Yes** | `replace_with_a_secure_jwt_secret` | Secret key used to sign and verify short-lived access JWT tokens. |
| `JWT_REFRESH_SECRET` | **Yes** | `replace_with_a_secure_refresh_secret` | Secret key used to sign and verify long-lived refresh tokens. |
| `JWT_EXPIRE` | Optional | `15m` | Lifetime of the access token (e.g., `15m`, `1h`). |
| `JWT_REFRESH_EXPIRE` | Optional | `7d` | Lifetime of the refresh token (e.g., `7d`, `30d`). |

### 2.4 Google OAuth 2.0 Settings

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `GOOGLE_CLIENT_ID` | Optional | *(empty)* | Google Cloud OAuth 2.0 Client ID. Required to enable Google Sign-In. |
| `GOOGLE_CLIENT_SECRET` | Optional | *(empty)* | Google Cloud OAuth 2.0 Client Secret. Keep strictly confidential. |
| `GOOGLE_CALLBACK_URL` | Optional | `http://localhost:5000/api/auth/google/callback` | Authorized redirect URI configured in the Google Cloud Console. |

### 2.5 Razorpay Payment Gateway

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `RAZORPAY_KEY_ID` | Optional | *(empty)* | Razorpay Key ID for generating server-side payment orders. |
| `RAZORPAY_KEY_SECRET` | Optional | *(empty)* | Razorpay Key Secret for verifying HMAC SHA-256 payment signatures. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | *(empty)* | Secret key configured in Razorpay Dashboard for webhook payload validation. |

### 2.6 Email Service (Nodemailer / BullMQ)

In development, if email credentials are not supplied, the server falls back gracefully by logging email bodies directly to the terminal without throwing errors.

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `EMAIL_HOST` | Optional | `smtp.gmail.com` | SMTP host (e.g., `smtp.sendgrid.net`, `smtp.gmail.com`). |
| `EMAIL_PORT` | Optional | `587` | SMTP port (typically `587` for TLS or `465` for SSL). |
| `EMAIL_USER` | Optional | *(empty)* | SMTP username or API key. |
| `EMAIL_PASS` | Optional | *(empty)* | SMTP password or App Password. |
| `EMAIL_FROM` | Optional | `noreply@manebazar.com` | Verified "From" email address. |
| `REDIS_URL` | Optional | `redis://127.0.0.1:6379` | Redis connection URL for BullMQ email queue. If absent, sends synchronously. |

### 2.7 WhatsApp Notifications (Twilio)

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `TWILIO_ACCOUNT_SID` | Optional | *(empty)* | Twilio account SID. |
| `TWILIO_AUTH_TOKEN` | Optional | *(empty)* | Twilio authentication token. |
| `TWILIO_WHATSAPP_NUMBER`| Optional | `whatsapp:+14155552671` | Twilio registered WhatsApp sandbox/business sender number. |
| `ADMIN_WHATSAPP_NUMBER` | Optional | *(empty)* | Merchant alert destination number in E.164 format (e.g., `+919876543210`). |

### 2.8 Security, Cookies & Rate Limiting

| Variable Name | Required? | Default Value | Description |
|---------------|-----------|---------------|-------------|
| `COOKIE_SECURE` | Optional | `false` (in dev) | When `true`, cookies are sent over HTTPS only. **Must be `true` in production.** |
| `COOKIE_SAME_SITE` | Optional | `lax` | SameSite cookie policy (`lax`, `strict`, or `none`). Set `none` only with HTTPS. |
| `AUTH_RATE_LIMIT_MAX` | Optional | `20` | Max auth attempts per 15-minute window. |
| `API_RATE_LIMIT_MAX` | Optional | `250` | Max global API requests per 15-minute window per IP. |
| `CHECKOUT_RATE_LIMIT_MAX`| Optional | `25` | Max checkout attempts per 10-minute window. |

---

## 3. Development vs Production Checklist

```
┌─────────────────────────┬──────────────────────┬──────────────────────┐
│ Setting                 │ Development          │ Production           │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ NODE_ENV                │ development          │ production           │
│ MONGODB_MEMORY_SERVER   │ true                 │ false                │
│ MONGO_URI               │ (blank)              │ mongodb+srv://...    │
│ COOKIE_SECURE           │ false                │ true                 │
│ COOKIE_SAME_SITE        │ lax                  │ strict / lax         │
│ CLIENT_URL              │ http://localhost:5173│ https://yourdomain   │
│ CORS_WHITELIST          │ localhost origins    │ Specific SSL domains │
│ JWT_SECRET              │ dev placeholder      │ 32+ char random key  │
└─────────────────────────┴──────────────────────┴──────────────────────┘
```
