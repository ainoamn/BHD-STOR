import { chromium } from 'playwright';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'api' || entry.startsWith('_')) continue;
      walk(full, acc);
    } else if (entry === 'page.tsx') {
      const route = full
        .replace(/\\/g, '/')
        .replace(/.*\/app\/\[locale\]/, '')
        .replace(/\/page\.tsx$/, '')
        .replace(/^\(main\)\//, '')
        .replace(/^\(auth\)\//, '');
      acc.push(route ? `/ar/${route}` : '/ar');
    }
  }
  return acc;
}

const appDir = new URL('../src/app/[locale]', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const routes = [...new Set(walk(appDir))].sort();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failures = [];

page.on('pageerror', (err) => {
  failures.push({ url: page.url(), message: err.message });
});

console.log(`Testing ${routes.length} routes...`);

for (const route of routes) {
  failures.length = 0;
  try {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);
    if (failures.length) {
      console.log(`FAIL ${route}: ${failures[0].message}`);
    }
  } catch (e) {
    console.log(`NAV  ${route}: ${e.message?.slice(0, 80)}`);
  }
}

const failCount = failures.length;
console.log('Done.');
await browser.close();
process.exit(0);
