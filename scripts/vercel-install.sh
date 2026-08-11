#!/usr/bin/env bash
# Install frontend deps and expose Next.js at repo root for Vercel detection.
set -euo pipefail

npm ci --prefix frontend

mkdir -p node_modules
# Vercel resolves next via require.resolve from the project Root Directory.
rm -rf node_modules/next node_modules/react node_modules/react-dom
ln -sfn ../frontend/node_modules/next node_modules/next
ln -sfn ../frontend/node_modules/react node_modules/react
ln -sfn ../frontend/node_modules/react-dom node_modules/react-dom

# Optional: surface configs so tooling that probes the monorepo root still works.
for f in next.config.js tsconfig.json postcss.config.js tailwind.config.ts middleware.ts middleware.js; do
  if [ -e "frontend/$f" ] && [ ! -e "$f" ]; then
    ln -sfn "frontend/$f" "$f"
  fi
done

if [ -d frontend/public ] && [ ! -e public ]; then
  ln -sfn frontend/public public
fi

if [ -d frontend/src ] && [ ! -e src ]; then
  ln -sfn frontend/src src
fi
