@echo off
chcp 65001 >nul
title BHD Store Dev Server

echo.
echo ========================================
echo  BHD Store - Dev Server
echo ========================================
echo.
echo  ALWAYS use this path only:
echo    C:\dev\bhd-app\frontend
echo.
echo  Do NOT run from:
echo    - Downloads\المتجر الاكتروني
echo    - Arabic folder paths (Webpack white screen)
echo    - Old extracted ZIP folders
echo.
echo  Site URL after start:
echo    http://localhost:3000/ar
echo ========================================
echo.

cd /d C:\dev\bhd-app\frontend
if errorlevel 1 (
  echo ERROR: C:\dev\bhd-app\frontend not found.
  pause
  exit /b 1
)

echo %CD% | findstr /I /C:"bhd-app" >nul
if errorlevel 1 (
  echo ERROR: Refusing to start outside C:\dev\bhd-app
  pause
  exit /b 1
)

if not exist .env.local (
  echo NEXT_PUBLIC_DEMO_MODE=false> .env.local
  echo NEXT_PUBLIC_API_URL=/api/v1>> .env.local
  echo NEXT_PUBLIC_APP_URL=http://localhost:3000>> .env.local
  echo BACKEND_URL=http://localhost:3001>> .env.local
)

if exist .next (
  echo Cleaning .next cache...
  rmdir /s /q .next
)

echo Starting Next.js...
npm run dev
