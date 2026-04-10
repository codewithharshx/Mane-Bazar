@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo       Mane Bazar - Startup Script 
echo ==============================================
echo.

if not exist "server\.env" (
  echo Creating server\.env from example...
  copy "server\.env.example" "server\.env" >nul
)

if not exist "client\.env" (
  echo Creating client\.env from example...
  copy "client\.env.example" "client\.env" >nul
)

if not exist "server\node_modules\" (
  echo Installing server dependencies...
  pushd server
  call npm install
  if errorlevel 1 (
    echo Server dependency installation failed.
    popd
    pause
    exit /b 1
  )
  popd
)

if not exist "client\node_modules\" (
  echo Installing client dependencies...
  pushd client
  call npm install
  if errorlevel 1 (
    echo Client dependency installation failed.
    popd
    pause
    exit /b 1
  )
  popd
)

echo.
echo ==============================================
echo [Notice] Mane Bazar Kasegaon details and the
echo 360+ item catalog have been fully integrated!
echo ==============================================
set /p RE_SEED="Do you want to run the database seeder? [y/N]: "
if /i "%RE_SEED%"=="y" (
  echo Generating fresh 360+ item dataset...
  pushd server
  node generate_dataset.js
  echo Seeding database with Mane Bazar authentic info...
  call npm run seed
  popd
  echo Seeding complete!
  echo.
)

echo Starting Backend API...
start "Mane Bazar Backend" cmd /k "cd /d %~dp0server && npm run dev"

echo Starting Frontend Web App...
start "Mane Bazar Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo Mane Bazar environment is launching!
echo The backend is running on http://localhost:5000 (Check backend console for exact port)
echo The frontend will be available at http://localhost:5173
echo.
pause
