#!/usr/bin/env bash
# ==============================================================================
# Mane Bazar - Cross-Platform Startup Script (macOS / Linux)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================="
echo "      Mane Bazar - Startup Script (Unix)      "
echo "=============================================="
echo ""

# Setup environment files
if [ ! -f "server/.env" ]; then
  echo "Creating server/.env from example..."
  cp "server/.env.example" "server/.env"
fi

if [ ! -f "client/.env.local" ]; then
  echo "Creating client/.env.local from example..."
  cp "client/.env.example" "client/.env.local"
fi

# Install dependencies if missing
if [ ! -d "server/node_modules" ]; then
  echo "Installing server dependencies..."
  (cd server && npm install)
fi

if [ ! -d "client/node_modules" ]; then
  echo "Installing client dependencies..."
  (cd client && npm install)
fi

echo ""
echo "=============================================="
echo "[Notice] Mane Bazar 360+ Kirana catalog ready"
echo "=============================================="
read -p "Do you want to run the database seeder? [y/N]: " -r RE_SEED
if [[ "$RE_SEED" =~ ^[Yy]$ ]]; then
  echo "Seeding database with Mane Bazar authentic grocery dataset..."
  (cd server && npm run seed)
  echo "Seeding complete!"
  echo ""
fi

echo "Starting Backend API and Frontend Web App..."
echo "- Backend:  http://localhost:5000"
echo "- Frontend: http://localhost:5173"
echo ""

# Concurrently run server and client
if command -v npx >/dev/null 2>&1; then
  npx concurrently --kill-others \
    "cd server && npm run dev" \
    "cd client && npm run dev"
else
  (cd server && npm run dev) &
  SERVER_PID=$!
  (cd client && npm run dev) &
  CLIENT_PID=$!
  trap "kill $SERVER_PID $CLIENT_PID" EXIT
  wait
fi

