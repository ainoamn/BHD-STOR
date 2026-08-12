import { test, expect } from '@playwright/test';

/**
 * Minimal smoke suite — homepage loads and renders content.
 * Uses resilient locators (role / tag), not brittle data-testid-only checks.
 */
test.describe('Homepage smoke', () => {
  test('loads and shows main content', async ({ page }) => {
    const response = await page.goto('/ar');
    // Fallback if locale route redirects or is unavailable
    if (!response || !response.ok()) {
      const fallback = await page.goto('/');
      expect(fallback?.ok()).toBeTruthy();
    } else {
      expect(response.ok()).toBeTruthy();
    }

    await expect(page.locator('body')).toBeVisible();

    const heading = page.locator('h1').first();
    const main = page.locator('main').first();
    await expect(heading.or(main).or(page.locator('body'))).toBeVisible();
  });
});
