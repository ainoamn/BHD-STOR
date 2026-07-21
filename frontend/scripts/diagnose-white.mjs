import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const logs = [];

page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 8).join('\n')));
page.on('console', (m) => {
  if (m.type() === 'error') logs.push(m.text().slice(0, 300));
});

await page.goto('http://localhost:3000/ar', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(5000);

const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) || '');
const htmlLen = await page.evaluate(() => document.body?.innerHTML?.length || 0);
const overlay = await page.evaluate(() => !!document.querySelector('[data-nextjs-dialog], nextjs-portal'));

console.log('bodyText:', JSON.stringify(bodyText));
console.log('htmlLen:', htmlLen);
console.log('errorOverlay:', overlay);
console.log('pageerrors:', errors.length ? errors.join('\n---\n') : 'none');
console.log('consoleErrors:', logs.slice(0, 8).join('\n---\n') || 'none');

await browser.close();
