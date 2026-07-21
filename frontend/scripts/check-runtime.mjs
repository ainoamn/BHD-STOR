import { chromium } from 'playwright';

const urls = [
  'http://localhost:3000/ar',
  'http://localhost:3000/ar/auth/login',
  'http://localhost:3000/ar/products/frankincense-oil',
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];

page.on('pageerror', (err) => {
  errors.push({ type: 'pageerror', url: page.url(), message: err.message, stack: err.stack });
});

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push({ type: 'console', url: page.url(), message: msg.text() });
  }
});

for (const url of urls) {
  console.log(`\n=== Visiting ${url} ===`);
  errors.length = 0;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    if (errors.length) {
      console.log('ERRORS:');
      for (const e of errors) console.log(JSON.stringify(e, null, 2));
    } else {
      console.log('No runtime errors detected');
    }
  } catch (e) {
    console.log('Navigation failed:', e.message);
  }
}

// Test login flow
console.log('\n=== Testing login flow ===');
errors.length = 0;
await page.goto('http://localhost:3000/ar/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
await page.fill('input[type="email"], input[name="email"]', 'admin@bhd.om');
await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
console.log('After login URL:', page.url());
if (errors.length) {
  console.log('LOGIN ERRORS:');
  for (const e of errors) console.log(JSON.stringify(e, null, 2));
} else {
  console.log('No login runtime errors detected');
}

await browser.close();
