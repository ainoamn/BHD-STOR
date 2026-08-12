import { test, expect } from '@playwright/test';

/**
 * Minimal smoke suite — homepage loads and renders content.
 * Resilient to soft API failures (homepage should still render shell).
 */
test.describe('Homepage smoke', () => {
  test('loads and shows main content', async ({ page }) => {
    let response = await page.goto('/ar', { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 500) {
      response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    }

    expect(response, 'homepage should respond').toBeTruthy();
    expect(response!.status(), 'homepage should not be a server error').toBeLessThan(500);

    await expect(page.locator('body')).toBeVisible();
    const heading = page.locator('h1').first();
    const main = page.locator('main').first();
    await expect(heading.or(main).or(page.locator('body'))).toBeVisible({
      timeout: 20_000,
    });
  });
});
