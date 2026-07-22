@echo off
chcp 65001 >nul
title BHD Store - Setup env

echo.
echo Setting up env files under C:\dev\bhd-app
echo.

cd /d C:\dev\bhd-app
if errorlevel 1 (
  echo ERROR: C:\dev\bhd-app not found
  pause
  exit /b 1
)

if not exist backend\.env (
  copy /Y backend\.env.example backend\.env >nul
  echo Created backend\.env from example
) else (
  echo backend\.env already exists
)

REM Replace empty OR placeholder secrets (dev convenience)
node scripts\fill-env-secrets.mjs
if errorlevel 1 (
  echo WARNING: could not fill secrets automatically
)

if not exist frontend\.env.local (
  (
    echo NEXT_PUBLIC_DEMO_MODE=false
    echo NEXT_PUBLIC_API_URL=/api/v1
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    echo BACKEND_URL=http://localhost:3001
  ) > frontend\.env.local
  echo Created frontend\.env.local ^(same-origin /api/v1 proxy^)
) else (
  echo frontend\.env.local already exists
)

echo.
echo Infra ^(Postgres + Redis^):
echo   docker compose -f docker-compose.infra.yml up -d
echo   ^(requires Docker Desktop^)
echo.
echo Next:
echo   1. Edit backend\.env with DB/Redis if needed ^(defaults match infra compose^)
echo   2. cd backend ^&^& npm install ^&^& npm run migration:run ^&^& npm run seed
echo   3. cd frontend ^&^& npm install ^&^& npm run dev
echo   4. Demo accounts after seed:
echo        admin@bhdoman.com / Bhd@dmin2024!
echo        customer@bhdoman.com / Customer@123!
echo        seller@bhdoman.com / Seller@123!
echo   5. After API is up: node scripts\smoke-buy-path.mjs
echo   6. Preflight: node scripts\check-env.mjs
echo.
pause
