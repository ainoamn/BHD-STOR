import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const chunkFails = [];

page.on('pageerror', (err) => errors.push(err.message));
page.on('response', (res) => {
  const url = res.url();
  if (url.includes('/_next/') && res.status() >= 400) {
    chunkFails.push(`${res.status()} ${url}`);
  }
});

await page.goto('http://localhost:3000/ar', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2000);

const webpackSrc = await page.evaluate(() => {
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  return scripts.find((s) => s.includes('webpack')) || scripts.slice(0, 3);
});

console.log('webpack/scripts:', webpackSrc);
console.log('pageerrors:', errors.length ? errors.join(' | ') : 'none');
console.log('chunkFails:', chunkFails.length ? chunkFails.join('\n') : 'none');

// login + admin
await page.goto('http://localhost:3000/ar/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
await page.fill('input[type="email"]', 'admin@bhd.om');
await page.fill('input[type="password"]', 'Admin@123');
errors.length = 0;
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);
console.log('after login:', page.url(), errors.length ? errors[0] : 'OK');

await page.goto('http://localhost:3000/ar/dashboard/admin', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);
console.log('admin:', errors.length ? errors.join(' | ') : 'OK');

await page.goto('http://localhost:3000/ar/loyalty', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);
console.log('loyalty:', errors.length ? errors.join(' | ') : 'OK');

await browser.close();
