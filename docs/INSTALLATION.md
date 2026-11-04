# Mane Bazar — Local Installation & Setup Guide

This guide walks you through setting up **Mane Bazar** on your local machine for development and testing.

---

## 1. Prerequisites

Before starting, ensure you have the following installed:

- **Node.js:** `v18.20.0` or higher (tested with `v20.x` and `v22.x`). [Download Node.js](https://nodejs.org/)
- **npm:** `v9.x` or higher (bundled with Node.js).
- **PostgreSQL:** `v14` or higher (tested on PostgreSQL 16 & 18). [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git:** [Download Git](https://git-scm.com/)

---

## 2. PostgreSQL Database Setup

Mane Bazar strictly requires **PostgreSQL**. Follow these steps to initialize your local database:

### A. Start PostgreSQL Service

- **Windows:** Ensure the `postgresql-x64-XX` service is running in Windows Services or via PowerShell:
  ```powershell
  Start-Service postgresql*
  ```
- **macOS (Homebrew):**
  ```bash
  brew services start postgresql@16
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo systemctl start postgresql
  ```

### B. Create Database and User

Log in to the PostgreSQL prompt:
```bash
psql -U postgres
```

Create the application database:
```sql
CREATE DATABASE mane_bazar;
```

*(Optional: If creating a dedicated application user)*
```sql
CREATE USER mane_bazar_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mane_bazar TO mane_bazar_user;
```

---

## 3. Clone Repository & Install Dependencies

Clone the Mane Bazar repository:

```bash
git clone https://github.com/codewithharshx/Mane-Bazar.git
cd Mane-Bazar
```

Install monorepo dependencies across all packages and apps:

```bash
npm install
```

---

## 4. Environment Configuration

Copy the example environment files for the monorepo workspaces:

### A. Database Workspace
```bash
# Windows
copy packages\database\.env.example packages\database\.env

# macOS / Linux
cp packages/database/.env.example packages/database/.env
```
Edit `packages/database/.env` and update your PostgreSQL connection string:
```ini
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/mane_bazar?schema=public"
```

### B. Backend Workspace
```bash
# Windows
copy apps\backend\.env.example apps\backend\.env

# macOS / Linux
cp apps/backend/.env.example apps/backend/.env
```
Configure your credentials in `apps/backend/.env`:
- `DATABASE_URL`: Match the database URL from above.
- `JWT_SECRET`: Random string (min 32 characters).
- `JWT_REFRESH_SECRET`: Random string (min 32 characters).
- `RAZORPAY_KEY_ID`: Razorpay test key ID (`rzp_test_...`).
- `RAZORPAY_KEY_SECRET`: Razorpay test key secret.

### C. Frontend Workspace
```bash
# Windows
copy apps\frontend\.env.example apps\frontend\.env

# macOS / Linux
cp apps/frontend/.env.example apps/frontend/.env
```
Ensure `VITE_API_URL` points to `http://localhost:4000/api`.

---

## 5. Database Migration & Seeding

### A. Run Prisma Migrations
Apply version-controlled database schema migrations to your PostgreSQL database:

```bash
npm run db:migrate
```

### B. Seed Authentic Kirana Catalog & Demo Accounts
Populate your database with categories, coupons, authentic kirana products, and demo accounts:

```bash
npm run db:seed
```

**Default Demo Credentials:**
- **Admin Account:**
  - Email: `admin@manebazar.com`
  - Password: `Admin@123`
- **Customer Account:**
  - Email: `user@manebazar.com`
  - Password: `User@123`

---

## 6. Running the Application

### Option 1: One-Click Startup Script

- **Windows:** Double-click `run.bat` or run:
  ```cmd
  run.bat
  ```
- **macOS / Linux:** Run:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

### Option 2: Standard Monorepo Dev Command

Start both backend and frontend concurrently:

```bash
npm run dev
```

Or start them individually:
```bash
# Terminal 1 — Backend API (Port 4000)
npm run dev:backend

# Terminal 2 — Frontend Web App (Port 5173)
npm run dev:frontend
```

---

## 7. Verifying Application Health

Open your browser and verify the services:

- **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
- **Backend Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
  - Expected response: `{"status":"ok","service":"mane-bazar-api",...}`
- **Prisma Studio (GUI Database Browser):**
  ```bash
  npm run db:studio
  ```
  Opens [http://localhost:5555](http://localhost:5555) to visually inspect PostgreSQL tables.

---

## 8. Common Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| `P1001: Can't reach database server` | PostgreSQL is not running or port is incorrect | Check that PostgreSQL is running on port 5432 and verify credentials in `.env`. |
| `EADDRINUSE: port 4000 already in use` | Another process is occupying port 4000 | Kill process on port 4000 or configure `PORT=4001` in `apps/backend/.env`. |
| `CORS error in browser console` | Origin mismatch | Ensure `CLIENT_URL=http://localhost:5173` is set in `apps/backend/.env`. |
| `CSRF token missing or invalid` | Missing CSRF cookie on unsafe request | Ensure cookies are enabled in your browser; frontend automatically sends `x-csrf-token`. |
