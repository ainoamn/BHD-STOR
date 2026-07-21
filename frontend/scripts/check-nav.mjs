import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const fatal = [];

page.on('pageerror', (err) => {
  fatal.push({ url: page.url(), message: err.message });
});

const steps = [
  ['http://localhost:3000/ar', 'home'],
  ['http://localhost:3000/ar/products/frankincense-oil', 'product'],
  ['http://localhost:3000/ar/auth/login', 'login'],
  ['http://localhost:3000/ar/dashboard/admin', 'admin'],
];

for (const [url, label] of steps) {
  fatal.length = 0;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  console.log(`${label}: ${fatal.length ? fatal.map((e) => e.message).join(' | ') : 'OK'}`);
}

// login + navigate
await page.goto('http://localhost:3000/ar/auth/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@bhd.om');
await page.fill('input[type="password"]', 'Admin@123');
fatal.length = 0;
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
console.log(`post-login: ${page.url()} ${fatal.length ? fatal[0].message : 'OK'}`);

await page.goto('http://localhost:3000/ar/dashboard/admin', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
console.log(`admin-after-login: ${fatal.length ? fatal.map((e) => e.message).join(' | ') : 'OK'}`);

await browser.close();
