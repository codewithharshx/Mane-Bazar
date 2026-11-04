# Mane Bazar — Installation & Local Setup Guide

Follow this guide to install, configure, and launch the **Mane Bazar** grocery platform locally.

---

## 1. System Prerequisites

Before starting, ensure your system meets these requirements:

| Tool | Minimum Version | Recommended Version | Verification Command |
|------|-----------------|---------------------|----------------------|
| **Node.js** | `v18.0.0` | `v20.x` or `v22.x` (LTS) | `node -v` |
| **npm** | `v9.0.0` | `v10.x` | `npm -v` |
| **Git** | `v2.30.0` | Latest | `git --version` |

> [!NOTE]
> **No local MongoDB installation is required for development!**  
> Mane Bazar includes built-in in-memory database support (`mongodb-memory-server`) that starts automatically during development.

---

## 2. Fast-Track Quickstart

### On Windows
Run the automated startup batch script from PowerShell or Command Prompt:

```cmd
git clone https://github.com/codewithharshx/Mane-Bazar.git
cd Mane-Bazar
run.bat
```

The script will automatically:
1. Generate `server/.env` and `client/.env.local` templates if they do not exist.
2. Install dependencies for the server and client.
3. Prompt you to seed the 360+ item grocery catalog.
4. Launch the backend API on `http://localhost:5000` and frontend on `http://localhost:5173`.

### On macOS / Linux
Run the Unix shell counterpart:

```bash
git clone https://github.com/codewithharshx/Mane-Bazar.git
cd Mane-Bazar
chmod +x run.sh
./run.sh
```

---

## 3. Manual Step-by-Step Installation

If you prefer installing dependencies manually or setting up custom scripts:

### Step 1: Clone the Repository
```bash
git clone https://github.com/codewithharshx/Mane-Bazar.git
cd Mane-Bazar
```

### Step 2: Install Root Dependencies
```bash
npm install
```

### Step 3: Configure and Install Backend (`server/`)
```bash
cd server
npm ci

# Create your local environment file
copy .env.example .env        # Windows Command Prompt
# or: cp .env.example .env    # PowerShell / macOS / Linux
```

In `server/.env`, verify the following defaults:
```env
PORT=5000
NODE_ENV=development
MONGODB_MEMORY_SERVER=true
MONGO_URI=
CLIENT_URL=http://localhost:5173
```

### Step 4: Seed the Grocery Catalog
Populate the database with the pre-configured 360+ kirana grocery dataset:
```bash
npm run seed
```
*(This creates categories, products with realistic pricing and inventory levels, active coupons, and a default admin user).*

### Step 5: Configure and Install Frontend (`client/`)
Open a new terminal window:
```bash
cd client
npm ci

# Create your local environment file
copy .env.example .env.local        # Windows Command Prompt
# or: cp .env.example .env.local    # PowerShell / macOS / Linux
```

Verify `client/.env.local` contains:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Running the Development Servers

### Option A: From Repository Root (Recommended)
You can start both server and client concurrently with a single command from the root directory:
```bash
npm run dev
```

### Option B: Separate Terminals

**Terminal 1 — Backend API:**
```bash
cd server
npm run dev
# Server runs on: http://localhost:5000
```

**Terminal 2 — Frontend Application:**
```bash
cd client
npm run dev
# Frontend runs on: http://localhost:5173
```

---

## 5. Health Checks & Verification

After starting both servers, verify their health status:

### 1. API Liveness Check
```bash
curl http://localhost:5000/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "service": "mane-bazar-api",
  "requestId": "6a9e1452-f47a-4293-8321-7f9cb8ec081b",
  "ts": "2026-11-04T09:30:00.000Z"
}
```

### 2. Database Readiness Check
```bash
curl http://localhost:5000/api/ready
```
**Expected Response:**
```json
{
  "status": "ready",
  "service": "mane-bazar-api",
  "uptimeSeconds": 15,
  "db": {
    "readyState": 1,
    "status": "connected"
  }
}
```

### 3. Frontend Storefront Check
Open your browser and navigate to:
```
http://localhost:5173
```
- You should see the Mane Bazar homepage with grocery categories, promotional banners, and product grids.
- Try searching for "Atta", "Rice", or "Masala" in the search bar.
- Test adding items to your cart drawer.

---

## 6. Troubleshooting Common Issues

### Issue 1: Port `5000` or `5173` Already in Use
**Symptom:** `Error: listen EADDRINUSE: address already in use :::5000`  
**Solution:**
- On Windows: Run `netstat -ano | findstr :5000` and terminate the PID with `taskkill /F /PID <pid>`.
- Or modify `PORT=5001` in `server/.env` and adjust `VITE_API_URL=http://localhost:5001/api` in `client/.env.local`.

### Issue 2: Windows PowerShell Script Execution Policy
**Symptom:** `File npm.ps1 cannot be loaded because running scripts is disabled on this system.`  
**Solution:**
Use `npm.cmd` explicitly or set your user execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Issue 3: In-Memory Database Download Timeout
**Symptom:** `MongoServerSelectionError` or slow startup on first launch.  
**Solution:**
On the very first launch, `mongodb-memory-server` downloads a pre-compiled MongoDB binary (~70MB). Ensure your internet connection is active during initial initialization. Subsequent server launches start in under 2 seconds from cache.

### Issue 4: EPERM or Permission Denied During `npm ci`
**Symptom:** `EPERM: operation not permitted, mkdir ...`  
**Solution:**
Antivirus or active Node processes can occasionally lock folders in Windows. Close any open terminal sessions, stop running dev servers, and re-run `npm ci`.

