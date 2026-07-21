@echo off
cd /d C:\dev\bhd-app\frontend
if exist .next rmdir /s /q .next
npm run dev
