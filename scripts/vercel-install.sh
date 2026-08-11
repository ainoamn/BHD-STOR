#!/usr/bin/env bash
# Materialize the Next.js app at the monorepo root for Vercel.
# Symlinks break @vercel/next post-build file tracing (lstat ENOENT on packages).
set -euo pipefail

ITEMS=(
  package.json
  package-lock.json
  next.config.js
  tsconfig.json
  postcss.config.js
  tailwind.config.ts
  next-env.d.ts
  public
  src
)

for name in "${ITEMS[@]}"; do
  if [ ! -e "frontend/$name" ]; then
    echo "WARN: frontend/$name missing" >&2
    continue
  fi
  rm -rf "$name"
  cp -a "frontend/$name" "$name"
done

npm ci

# Prove framework detection + tracing deps exist as real files.
node -e "console.log('next@' + require('next/package.json').version)"
test -f node_modules/client-only/package.json
test -f node_modules/next/package.json
echo "vercel-install: root app ready"
