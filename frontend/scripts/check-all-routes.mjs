import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const allErrors = [];

page.on('pageerror', (err) => {
  allErrors.push({ url: page.url(), message: err.message, stack: err.stack?.split('\n').slice(0, 5).join('\n') });
});

const routes = [
  '/ar',
  '/ar/auth/login',
  '/ar/products/frankincense-oil',
  '/ar/dashboard',
  '/ar/dashboard/admin',
  '/ar/dashboard/admin/users',
  '/ar/dashboard/admin/orders',
  '/ar/dashboard/admin/analytics',
  '/ar/dashboard/admin/payments',
  '/ar/dashboard/admin/crm',
  '/ar/loyalty',
  '/ar/returns',
  '/ar/challenges',
];

for (const route of routes) {
  allErrors.length = 0;
  try {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(2000);
    if (allErrors.length) {
      console.log(`FAIL ${route}:`);
      for (const e of allErrors) console.log(`  ${e.message}`);
    } else {
      console.log(`OK   ${route}`);
    }
  } catch (e) {
    console.log(`NAV  ${route}: ${e.message}`);
  }
}

// Login flow
allErrors.length = 0;
await page.goto('http://localhost:3000/ar/auth/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@bhd.om');
await page.fill('input[type="password"]', 'Admin@123');
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

const postLoginRoutes = ['/ar', '/ar/dashboard/admin', '/ar/dashboard/admin/users'];
for (const route of postLoginRoutes) {
  allErrors.length = 0;
  await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2000);
  if (allErrors.length) {
    console.log(`FAIL post-login ${route}:`);
    for (const e of allErrors) console.log(`  ${e.message}`);
  } else {
    console.log(`OK   post-login ${route}`);
  }
}

await browser.close();
