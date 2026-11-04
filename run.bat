@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo       Mane Bazar - Startup Script 
echo    PostgreSQL + TypeScript Monorepo
echo ==============================================
echo.

if not exist "apps\backend\.env" (
  echo Creating apps\backend\.env from example...
  copy "apps\backend\.env.example" "apps\backend\.env" >nul
)

if not exist "packages\database\.env" (
  echo Creating packages\database\.env from example...
  copy "packages\database\.env.example" "packages\database\.env" >nul
)

if not exist "apps\frontend\.env" (
  echo Creating apps\frontend\.env from example...
  copy "apps\frontend\.env.example" "apps\frontend\.env" >nul
)

if not exist "node_modules\" (
  echo Installing monorepo dependencies...
  call npm install
  if errorlevel 1 (
    echo Monorepo dependency installation failed.
    pause
    exit /b 1
  )
)

echo.
echo ==============================================
echo Database: PostgreSQL with Prisma ORM
echo ==============================================
set /p RUN_MIGRATE="Run Prisma database migrations? [y/N]: "
if /i "%RUN_MIGRATE%"=="y" (
  echo Applying Prisma migrations to PostgreSQL...
  call npm run db:migrate
  echo Migration complete!
  echo.
)

set /p RE_SEED="Run database seeder (demo catalog & users)? [y/N]: "
if /i "%RE_SEED%"=="y" (
  echo Seeding database with authentic Mane Bazar grocery catalog...
  call npm run db:seed
  echo Seeding complete!
  echo.
)

echo Starting Backend API and Frontend Web App...
echo - Backend API:  http://localhost:4000
echo - Frontend App: http://localhost:5173
echo.

call npm run dev
