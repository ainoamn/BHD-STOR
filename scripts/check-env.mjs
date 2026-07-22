#!/usr/bin/env node
/**
 * Local preflight: report missing env / infra without printing secret values.
 *
 * Usage: node scripts/check-env.mjs
 */
const fs = require('fs');
const path = require('path');
const net = require('net');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, 'backend', '.env');

function parseEnv(file) {
  if (!fs.existsSync(file)) return null;
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

function isWeak(value, min = 16) {
  if (!value) return true;
  const v = value.toLowerCase();
  if (value.length < min) return true;
  return (
    v.includes('change-in-production') ||
    v.includes('your-jwt') ||
    v.includes('changeme') ||
    v === 'secret' ||
    v === 'password'
  );
}

function probe(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      try {
        socket.destroy();
      } catch {
        /* ignore */
      }
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

async function main() {
  const report = [];
  const env = parseEnv(envPath);
  if (!env) {
    report.push('FAIL backend/.env missing — run setup-env.bat');
  } else {
    report.push('OK   backend/.env present');
    const checks = [
      ['JWT_SECRET', 32],
      ['JWT_REFRESH_SECRET', 32],
      ['ENCRYPTION_MASTER_KEY', 64],
      ['DB_HOST', 1],
      ['DB_NAME', 1],
      ['REDIS_HOST', 1],
    ];
    for (const [key, min] of checks) {
      const val = env[key];
      if (key === 'ENCRYPTION_MASTER_KEY') {
        if (!val || !/^[0-9a-fA-F]{64}$/.test(val)) {
          report.push(`WARN ${key} missing or not 64 hex (required in production)`);
        } else {
          report.push(`OK   ${key} set`);
        }
        continue;
      }
      if (isWeak(val, min)) {
        report.push(`WARN ${key} weak/empty — run setup-env.bat or set a strong value`);
      } else {
        report.push(`OK   ${key} set`);
      }
    }
  }

  const dbHost = env?.DB_HOST || 'localhost';
  const dbPort = parseInt(env?.DB_PORT || '5432', 10);
  const redisHost = env?.REDIS_HOST || 'localhost';
  const redisPort = parseInt(env?.REDIS_PORT || '6379', 10);

  const pg = await probe(dbHost, dbPort);
  report.push(pg ? `OK   Postgres reachable ${dbHost}:${dbPort}` : `FAIL Postgres not reachable ${dbHost}:${dbPort}`);
  const rd = await probe(redisHost, redisPort);
  report.push(rd ? `OK   Redis reachable ${redisHost}:${redisPort}` : `FAIL Redis not reachable ${redisHost}:${redisPort}`);

  console.log(report.join('\n'));
  const failed = report.some((l) => l.startsWith('FAIL'));
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('CHECK_ENV_ERROR', err);
  process.exit(1);
});
