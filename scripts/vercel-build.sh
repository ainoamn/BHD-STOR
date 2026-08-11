#!/usr/bin/env bash
# Build Next.js at the monorepo root (install script has already linked frontend here).
set -euo pipefail

export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_DEMO_MODE="${NEXT_PUBLIC_DEMO_MODE:-false}"

# Run via linked package.json "build" (next build) so traces use root paths.
npm run build

if [ ! -d .next ]; then
  echo "ERROR: .next output not found after next build" >&2
  exit 1
fi
