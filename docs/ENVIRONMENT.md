# Mane Bazar — Environment Configuration & Security Reference

This document provides an exhaustive reference for all environment variables used across the **Mane Bazar** monorepo workspaces (`apps/backend`, `apps/frontend`, and `packages/database`).

---

## 1. Environment File Hierarchy

| Target Workspace | File Location | Purpose | Tracked in Git? |
|------------------|---------------|---------|-----------------|
| Monorepo Root Reference | `.env.example` | Template reference for entire repository | Yes |
| Database Package | `packages/database/.env` | PostgreSQL database connection string for Prisma | No (`.gitignore`) |
| Backend API | `apps/backend/.env` | Server runtime, authentication, email & payment secrets | No (`.gitignore`) |
| Frontend Web App | `apps/frontend/.env` | Vite public client variables (prefixed with `VITE_`) | No (`.gitignore`) |

> [!CAUTION]
> Never commit actual `.env` files containing live secrets, private keys, or passwords. All `.env` files are ignored by `.gitignore`.

---

## 2. Exhaustive Variable Reference

### A. Database Configuration (`packages/database/.env` & `apps/backend/.env`)

| Variable | Required | Default / Example | Description |
|----------|:--------:|-------------------|-------------|
| `DATABASE_URL` | **Yes** | `postgresql://postgres:password@localhost:5432/mane_bazar?schema=public` | Complete PostgreSQL connection string used by Prisma ORM. Supports connection pool options (e.g. `?connection_limit=10&sslmode=prefer`). |

### B. Backend Runtime & Security (`apps/backend/.env`)

| Variable | Required | Default / Example | Description |
|----------|:--------:|-------------------|-------------|
| `PORT` | No | `4000` | Port on which the Express REST API listens. |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`). |
| `JWT_SECRET` | **Yes** | `[random 32+ chars]` | Secret key used to sign and verify short-lived access tokens (15m TTL). |
| `JWT_REFRESH_SECRET` | **Yes** | `[random 32+ chars]` | Secret key used to sign and verify long-lived refresh tokens (7d TTL). |
| `JWT_EXPIRE` | No | `15m` | Expiration time for access tokens. |
| `JWT_REFRESH_EXPIRE` | No | `7d` | Expiration time for refresh tokens. |
| `CLIENT_URL` | **Yes** | `http://localhost:5173` | Canonical URL of the client frontend for CORS and redirects. |
| `CORS_WHITELIST` | No | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of permitted browser origins for cross-origin requests. |
| `COOKIE_DOMAIN` | No | `localhost` | Domain scope for HttpOnly session and refresh cookies. |
| `COOKIE_SECURE` | No | `false` (dev) / `true` (prod) | Requires HTTPS transmission for auth cookies. Must be `true` in production. |
| `COOKIE_SAME_SITE` | No | `lax` | Cookie SameSite policy (`lax`, `strict`, `none`). |
| `ADMIN_EMAIL` | No | `admin@manebazar.com` | Default administrator account email for system notifications. |

### C. OAuth & Third-Party Integrations (`apps/backend/.env`)

| Variable | Required | Example | Description |
|----------|:--------:|---------|-------------|
| `GOOGLE_CLIENT_ID` | Optional | `xxx.apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID for Google login. |
| `GOOGLE_CLIENT_SECRET` | Optional | `GOCSPX-xxxx` | Google OAuth 2.0 client secret. |
| `GOOGLE_CALLBACK_URL` | Optional | `http://localhost:4000/api/auth/google/callback` | Authorized redirect URI configured in Google Cloud Console. |
| `RAZORPAY_KEY_ID` | **Yes** | `rzp_test_xxxx` | Razorpay Merchant Key ID for payment creation. |
| `RAZORPAY_KEY_SECRET` | **Yes** | `xxxx` | Razorpay Key Secret for cryptographic HMAC SHA-256 signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | `xxxx` | Secret token to authenticate incoming Razorpay payment webhooks. |

### D. Email Notification Services (`apps/backend/.env`)

| Variable | Required | Example | Description |
|----------|:--------:|---------|-------------|
| `SMTP_HOST` | Optional | `smtp.gmail.com` | Outgoing SMTP mail server hostname. |
| `SMTP_PORT` | Optional | `587` | SMTP port (`587` for STARTTLS, `465` for SSL). |
| `SMTP_USER` | Optional | `orders@manebazar.com` | Authenticated SMTP username or email address. |
| `SMTP_PASS` | Optional | `app-password` | SMTP user password or Google App Password. |
| `EMAIL_FROM` | Optional | `Mane Bazar <noreply@manebazar.com>` | Sender display name and address for transactional emails. |

### E. Rate Limiting Controls (`apps/backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Time window for authentication endpoints. |
| `AUTH_RATE_LIMIT_MAX` | `20` | Max attempts per window before blocking IP. |
| `API_RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Time window for general API requests. |
| `API_RATE_LIMIT_MAX` | `250` | Max API calls allowed per window. |
| `CHECKOUT_RATE_LIMIT_WINDOW_MS` | `600000` (10 min) | Time window for checkout requests. |
| `CHECKOUT_RATE_LIMIT_MAX` | `25` | Max checkout attempts per IP per window. |

### F. Frontend Web Application (`apps/frontend/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `VITE_API_URL` | **Yes** | `http://localhost:4000/api` | Base REST API URL accessed by frontend TanStack Query and Axios clients. |
| `VITE_RAZORPAY_KEY_ID` | **Yes** | `rzp_test_xxxx` | Public Razorpay key ID passed to the checkout modal popup. |
| `VITE_GOOGLE_CLIENT_ID` | Optional | `xxx.apps.googleusercontent.com` | Public Google client ID for `@react-oauth/google` button. |

---

## 3. Secret Generation Helper

Generate cryptographically secure 64-character hex strings for `JWT_SECRET` and `JWT_REFRESH_SECRET` using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
