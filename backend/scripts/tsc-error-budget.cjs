#!/usr/bin/env node
/**
 * Fail CI when Backend TypeScript errors grow above the committed budget.
 * Does not require a clean tsc (legacy debt); prevents regression.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const baselinePath = path.join(__dirname, 'tsc-error-baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const maxErrors = Number(baseline.maxErrors);

if (!Number.isFinite(maxErrors) || maxErrors < 0) {
  console.error('Invalid maxErrors in tsc-error-baseline.json');
  process.exit(2);
}

const tscJs = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!fs.existsSync(tscJs)) {
  console.error('typescript package not found (node_modules/typescript/bin/tsc)');
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  [tscJs, '-p', 'tsconfig.typecheck.json', '--noEmit', '--pretty', 'false'],
  {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, CI: 'true' },
  },
);

if (result.error) {
  console.error('Failed to run tsc:', result.error.message);
  process.exit(2);
}

const output = `${result.stdout || ''}\n${result.stderr || ''}`;
const matches = output.match(/error TS\d+/g) || [];
const count = matches.length;

console.log(`Backend tsc errors: ${count} (budget ≤ ${maxErrors})`);

// tsc exits 1 when errors exist; exit 0 when clean. Empty output + non-zero is suspicious.
if (count === 0 && result.status !== 0) {
  console.error(
    `tsc exited with status ${result.status} but no error TS lines were parsed. Gate misconfigured.`,
  );
  console.error(output.slice(0, 2000));
  process.exit(2);
}

if (count > maxErrors) {
  console.error(
    `\nTypeScript error budget exceeded: ${count} > ${maxErrors}.\n` +
      `Fix new type errors or intentionally raise scripts/tsc-error-baseline.json after review.\n`,
  );
  const lines = output
    .split(/\r?\n/)
    .filter((l) => /error TS\d+/.test(l))
    .slice(0, 25);
  for (const line of lines) console.error(line);
  process.exit(1);
}

if (count < maxErrors) {
  console.log(
    `Errors improved (${count} < ${maxErrors}). Consider lowering maxErrors in tsc-error-baseline.json.`,
  );
}

process.exit(0);
