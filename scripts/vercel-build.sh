#!/usr/bin/env bash
# Build Next.js at monorepo root after vercel-install promoted frontend files here.
set -euo pipefail

export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_DEMO_MODE="${NEXT_PUBLIC_DEMO_MODE:-false}"

npm run build

if [ ! -d .next ]; then
  echo "ERROR: .next missing after build" >&2
  exit 1
fi

echo "vercel-build: ok"
