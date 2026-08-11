#!/usr/bin/env bash
# Build the Next.js app (frontend) and place output where Vercel expects it.
set -euo pipefail

export NEXT_TELEMETRY_DISABLED=1
# Production safety net if env is unset on first deploy.
export NEXT_PUBLIC_DEMO_MODE="${NEXT_PUBLIC_DEMO_MODE:-false}"

npm run build --prefix frontend

rm -rf .next
cp -a frontend/.next .next
