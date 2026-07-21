@echo off
cd /d C:\dev\bhd-app\frontend
if errorlevel 1 (
  echo ERROR: Use C:\dev\bhd-app only. Arabic paths cause a white screen.
  pause
  exit /b 1
)
if not exist .env.local (
  echo NEXT_PUBLIC_DEMO_MODE=true> .env.local
  echo NEXT_PUBLIC_API_URL=http://localhost:3001>> .env.local
)
if exist .next rmdir /s /q .next
npm run dev
