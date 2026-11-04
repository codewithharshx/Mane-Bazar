#!/usr/bin/env bash
# ==============================================================================
# Mane Bazar - Cross-Platform Startup Script (macOS / Linux)
# PostgreSQL + TypeScript Monorepo
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=============================================="
echo "      Mane Bazar - Startup Script (Unix)      "
echo "    PostgreSQL + TypeScript Monorepo"
echo "=============================================="
echo ""

# Setup environment files
if [ ! -f "apps/backend/.env" ]; then
  echo "Creating apps/backend/.env from example..."
  cp "apps/backend/.env.example" "apps/backend/.env"
fi

if [ ! -f "packages/database/.env" ]; then
  echo "Creating packages/database/.env from example..."
  cp "packages/database/.env.example" "packages/database/.env"
fi

if [ ! -f "apps/frontend/.env" ]; then
  echo "Creating apps/frontend/.env from example..."
  cp "apps/frontend/.env.example" "apps/frontend/.env"
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "Installing monorepo dependencies..."
  npm install
fi

echo ""
echo "=============================================="
echo "Database: PostgreSQL with Prisma ORM"
echo "=============================================="
read -p "Run Prisma database migrations? [y/N]: " -r RUN_MIGRATE
if [[ "$RUN_MIGRATE" =~ ^[Yy]$ ]]; then
  echo "Applying Prisma migrations to PostgreSQL..."
  npm run db:migrate
  echo "Migration complete!"
  echo ""
fi

read -p "Run database seeder (demo catalog & users)? [y/N]: " -r RE_SEED
if [[ "$RE_SEED" =~ ^[Yy]$ ]]; then
  echo "Seeding database with authentic Mane Bazar grocery catalog..."
  npm run db:seed
  echo "Seeding complete!"
  echo ""
fi

echo "Starting Backend API and Frontend Web App..."
echo "- Backend API:  http://localhost:4000"
echo "- Frontend App: http://localhost:5173"
echo ""

npm run dev
