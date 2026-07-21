import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000/ar", { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(3000);
const text = await page.evaluate(() => document.body?.innerText || "");
const hasHero = text.includes("تسوق") || text.includes("Shop");
const hasNav = text.includes("BHD");
const opacityHidden = await page.evaluate(() => {
  const els = [...document.querySelectorAll("[style*='opacity: 0'], .opacity-0")];
  return els.length;
});
console.log({ hasNav, hasHero, opacityHidden, errors: errors.slice(0,3), snippet: text.slice(0,180).replace(/\n/g," | ") });
await browser.close();
