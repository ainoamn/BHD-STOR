#!/usr/bin/env node
/**
 * Fill empty/placeholder secrets in backend/.env (dev convenience).
 * Does not print secret values.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', 'backend', '.env');
if (!fs.existsSync(envPath)) {
  console.error('backend/.env not found');
  process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf8');
let changed = false;

function hex(n) {
  return crypto.randomBytes(Math.ceil(n / 2)).toString('hex').slice(0, n);
}

function upsert(key, generator, isPlaceholder) {
  const re = new RegExp(`^${key}=(.*)$`, 'm');
  const match = content.match(re);
  if (!match) {
    content += `\n${key}=${generator()}\n`;
    changed = true;
    console.log(`Added ${key}`);
    return;
  }
  const current = (match[1] || '').trim();
  if (!current || isPlaceholder(current)) {
    content = content.replace(re, `${key}=${generator()}`);
    changed = true;
    console.log(`Generated ${key}`);
  }
}

upsert(
  'JWT_SECRET',
  () => hex(48),
  (v) => /your-jwt-secret|change-in-production|changeme/i.test(v) || v.length < 32,
);
upsert(
  'JWT_REFRESH_SECRET',
  () => hex(48),
  (v) => /your-jwt-refresh|change-in-production|changeme/i.test(v) || v.length < 32,
);
upsert(
  'ENCRYPTION_MASTER_KEY',
  () => hex(64),
  (v) => !/^[0-9a-fA-F]{64}$/.test(v),
);

if (changed) {
  fs.writeFileSync(envPath, content, 'utf8');
} else {
  console.log('Secrets already look set');
}
