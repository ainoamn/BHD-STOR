#!/usr/bin/env bash
# Make the monorepo root look like the Next.js app for Vercel (@vercel/next).
# Installs deps in frontend/, then links node_modules + app files at repo root.
set -euo pipefail

npm ci --prefix frontend

rm -rf node_modules
ln -sfn frontend/node_modules node_modules

link_item() {
  local name="$1"
  if [ -e "frontend/$name" ] || [ -L "frontend/$name" ]; then
    rm -rf "$name"
    ln -sfn "frontend/$name" "$name"
  fi
}

for name in \
  package.json \
  package-lock.json \
  next.config.js \
  tsconfig.json \
  postcss.config.js \
  tailwind.config.ts \
  next-env.d.ts \
  middleware.ts \
  middleware.js \
  instrumentation.ts \
  instrumentation.js \
  public \
  src
do
  link_item "$name"
done

# Sanity: Next must resolve from the monorepo root.
node -e "console.log('next@' + require('next/package.json').version)"
