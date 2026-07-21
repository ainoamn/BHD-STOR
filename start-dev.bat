@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  BHD Store - Dev Server
echo  IMPORTANT: Run from ASCII path only
echo ========================================
echo.

cd /d C:\dev\bhd-app\frontend
if not exist .env.local (
  echo NEXT_PUBLIC_DEMO_MODE=true> .env.local
  echo NEXT_PUBLIC_API_URL=http://localhost:3001>> .env.local
)
if exist .next rmdir /s /q .next
npm run dev
