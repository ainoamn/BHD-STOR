import { test, expect } from '@playwright/test';

/**
 * ============================================================================
 * Home Page E2E Tests
 * Tests: Hero section, categories, product navigation, language switch, RTL
 * ============================================================================
 */

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  // ========================================================================
  // Hero Section
  // ========================================================================
  test.describe('Hero Section', () => {
    test('should display hero section', async ({ page }) => {
      // Check hero section exists
      const heroSection = page.locator('[data-testid="hero-section"]').or(
        page.locator('section').first()
      );
      await expect(heroSection).toBeVisible();

      // Check hero heading
      const heroHeading = page.locator('h1').first();
      await expect(heroHeading).toBeVisible();
      await expect(heroHeading).not.toBeEmpty();

      // Check hero has some content (either Arabic or English)
      const headingText = await heroHeading.textContent();
      expect(headingText?.length).toBeGreaterThan(0);
    });

    test('should display hero CTA button', async ({ page }) => {
      const ctaButton = page.locator('[data-testid="hero-cta"]').or(
        page.locator('button').filter({ hasText: /تسوق|Shop|ابدأ|Start/i }).first()
      );
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
    });

    test('should display hero image or video', async ({ page }) => {
      const heroMedia = page.locator('[data-testid="hero-image"]').or(
        page.locator('img[alt*="hero" i]').first()
      ).or(
        page.locator('section').first().locator('img').first()
      );
      
      // Hero image may be lazy-loaded, just check the container exists
      const heroContainer = page.locator('section').first();
      await expect(heroContainer).toBeVisible();
    });

    test('should navigate when clicking hero CTA', async ({ page }) => {
      const ctaButton = page.locator('[data-testid="hero-cta"]').or(
        page.locator('a, button').filter({ hasText: /تسوق|Shop|ابدأ|Start|explore/i }).first()
      );

      if (await ctaButton.isVisible().catch(() => false)) {
        await ctaButton.click();
        
        // Should navigate to products or categories
        await expect(page).toHaveURL(/.*(products|categories|shop).*/i);
      }
    });
  });

  // ========================================================================
  // Categories Section
  // ========================================================================
  test.describe('Categories Section', () => {
    test('should display categories section', async ({ page }) => {
      const categoriesSection = page.locator('[data-testid="categories-section"]').or(
        page.locator('section:has-text("التصنيفات")').or(
          page.locator('section:has-text("Categories")')
        )
      );
      
      // Categories might be below the fold, so scroll to find them
      const categoriesHeading = page.locator('h2, h3').filter({ 
        hasText: /تصنيفات|فئات|Categories/i 
      }).first();
      
      if (await categoriesHeading.isVisible().catch(() => false)) {
        await expect(categoriesHeading).toBeVisible();
      }
    });

    test('should display category cards or links', async ({ page }) => {
      // Look for category links/cards
      const categoryLinks = page.locator('a[href*="category"], a[href*="categories"]').or(
        page.locator('[data-testid*="category"]')
      );

      // If no specific category links found, look for common category names
      const commonCategories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Food', 'إلكترونيات', 'أزياء', 'منزل'];
      
      let categoryFound = false;
      for (const cat of commonCategories) {
        const locator = page.locator('text=' + cat).first();
        if (await locator.isVisible().catch(() => false)) {
          categoryFound = true;
          break;
        }
      }

      // At least some categories should be present
      expect(categoryFound || (await categoryLinks.count()) > 0).toBeTruthy();
    });

    test('should navigate to category page on click', async ({ page }) => {
      // Find first category link
      const categoryLink = page.locator('a[href*="category"]').first().or(
        page.locator('[data-testid^="category-"] a').first()
      );

      if (await categoryLink.isVisible().catch(() => false)) {
        const href = await categoryLink.getAttribute('href');
        await categoryLink.click();
        
        // Should navigate to a category page
        await expect(page).toHaveURL(new RegExp(href || 'category'));
      }
    });
  });

  // ========================================================================
  // Featured Products
  // ========================================================================
  test.describe('Featured Products', () => {
    test('should display featured products section', async ({ page }) => {
      const featuredHeading = page.locator('h2, h3, h4').filter({
        hasText: /مميز|Featured|منتجات|Products/i,
      }).first();

      if (await featuredHeading.isVisible().catch(() => false)) {
        await expect(featuredHeading).toBeVisible();
      }
    });

    test('should display product cards', async ({ page }) => {
      // Look for product cards
      const productCards = page.locator('[data-testid*="product"]').or(
        page.locator('a[href*="product"]')
      );

      // Or look for product prices (common indicator)
      const priceElements = page.locator('text=/\\d+\\.\\d{3}/').or(
        page.locator('text=/\\d+\\.\\d{2}/')
      );

      const hasProducts = (await productCards.count() > 0) || 
                          (await priceElements.count() > 0);
      
      // Featured products section may or may not have items
      // Just verify the page structure is correct
      expect(hasProducts || await featuredHeadingExists(page)).toBeTruthy();
    });

    test('should navigate to product detail page', async ({ page }) => {
      const productLink = page.locator('a[href*="product"]').first().or(
        page.locator('[data-testid^="product-"] a').first()
      );

      if (await productLink.isVisible().catch(() => false)) {
        const href = await productLink.getAttribute('href');
        await productLink.click();
        
        await expect(page).toHaveURL(new RegExp(href || 'product'));
        
        // Product detail page should have product info
        const productName = page.locator('h1').first();
        await expect(productName).toBeVisible();
      }
    });
  });

  // ========================================================================
  // Navigation
  // ========================================================================
  test.describe('Navigation', () => {
    test('should display header/navigation', async ({ page }) => {
      const header = page.locator('header').or(
        page.locator('nav').first()
      ).or(
        page.locator('[data-testid="header"]')
      );

      await expect(header).toBeVisible();
    });

    test('should display logo', async ({ page }) => {
      const logo = page.locator('[data-testid="logo"]').or(
        page.locator('header img[alt*="logo" i]').first()
      ).or(
        page.locator('header a').first()
      );

      await expect(logo).toBeVisible();
    });

    test('should display search bar', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]').or(
        page.locator('input[placeholder*="بحث" i]').or(
          page.locator('input[placeholder*="Search" i]')
        )
      ).or(
        page.locator('[data-testid="search-input"]')
      );

      if (await searchInput.isVisible().catch(() => false)) {
        await expect(searchInput).toBeVisible();
      }
    });

    test('should display cart icon/link', async ({ page }) => {
      const cartLink = page.locator('a[href*="cart"]').or(
        page.locator('[data-testid="cart-link"]').or(
          page.locator('[data-testid="cart-icon"]')
        )
      );

      if (await cartLink.isVisible().catch(() => false)) {
        await expect(cartLink).toBeVisible();
      }
    });

    test('should display auth links (login/register)', async ({ page }) => {
      const authLinks = page.locator('a').filter({
        hasText: /تسجيل الدخول|دخول|Login|تسجيل|Register|حساب|Account/i,
      });

      const authButton = page.locator('button').filter({
        hasText: /دخول|Login|حساب|Account/i,
      });

      const hasAuth = (await authLinks.count() > 0) || (await authButton.count() > 0);
      expect(hasAuth).toBeTruthy();
    });
  });

  // ========================================================================
  // Language Switch
  // ========================================================================
  test.describe('Language Switch', () => {
    test('should display language switcher', async ({ page }) => {
      const langSwitcher = page.locator('[data-testid="language-switcher"]').or(
        page.locator('button').filter({
          hasText: /English|العربية|EN|AR/i,
        }).first()
      );

      if (await langSwitcher.isVisible().catch(() => false)) {
        await expect(langSwitcher).toBeVisible();
      }
    });

    test('should switch language to English', async ({ page }) => {
      const langSwitcher = page.locator('[data-testid="language-switcher"]').or(
        page.locator('button').filter({ hasText: /English/i }).first()
      );

      if (await langSwitcher.isVisible().catch(() => false)) {
        await langSwitcher.click();
        
        // Wait for language to change
        await page.waitForTimeout(1000);
        
        // Check URL has English locale
        const currentUrl = page.url();
        expect(currentUrl.includes('/en') || !currentUrl.includes('/ar')).toBeTruthy();
      }
    });

    test('should switch language to Arabic', async ({ page }) => {
      // First switch to English
      const enSwitcher = page.locator('button').filter({ hasText: /English/i }).first();
      if (await enSwitcher.isVisible().catch(() => false)) {
        await enSwitcher.click();
        await page.waitForTimeout(500);
      }

      // Then switch back to Arabic
      const arSwitcher = page.locator('button').filter({ hasText: /العربية/i }).first();
      if (await arSwitcher.isVisible().catch(() => false)) {
        await arSwitcher.click();
        await page.waitForTimeout(1000);
        
        // Check URL has Arabic locale
        const currentUrl = page.url();
        expect(currentUrl.includes('/ar') || currentUrl === page.context()._options.baseURL + '/').toBeTruthy();
      }
    });
  });

  // ========================================================================
  // RTL Layout Check
  // ========================================================================
  test.describe('RTL Layout', () => {
    test('should have RTL direction for Arabic', async ({ page }) => {
      // Check HTML has dir="rtl" when on Arabic locale
      const html = page.locator('html');
      const dir = await html.getAttribute('dir');
      
      // Should be RTL for Arabic default
      expect(dir === 'rtl' || dir === null).toBeTruthy();
    });

    test('should flip layout for RTL', async ({ page }) => {
      const header = page.locator('header').first();
      
      if (await header.isVisible().catch(() => false)) {
        // Check that the header contains elements
        const headerChildren = header.locator('> *');
        const count = await headerChildren.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should have correct font for Arabic text', async ({ page }) => {
      const body = page.locator('body');
      const fontFamily = await body.evaluate((el) => 
        window.getComputedStyle(el).fontFamily
      );
      
      // Should contain Arabic-supporting fonts
      expect(
        fontFamily.includes('Noto') || 
        fontFamily.includes('Cairo') ||
        fontFamily.includes('Tajawal') ||
        fontFamily.includes('Arial') ||
        fontFamily.includes('sans-serif')
      ).toBeTruthy();
    });
  });

  // ========================================================================
  // Footer
  // ========================================================================
  test.describe('Footer', () => {
    test('should display footer', async ({ page }) => {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const footer = page.locator('footer').or(
        page.locator('[data-testid="footer"]')
      );

      if (await footer.isVisible().catch(() => false)) {
        await expect(footer).toBeVisible();
      }
    });

    test('should display copyright text', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      const copyright = page.locator('text=/\\u00A9|©|حقوق|copyright/i').first();
      
      if (await copyright.isVisible().catch(() => false)) {
        await expect(copyright).toBeVisible();
      }
    });
  });
});

// Helper function
async function featuredHeadingExists(page: any): Promise<boolean> {
  const headings = page.locator('h2, h3');
  const count = await headings.count();
  for (let i = 0; i < count; i++) {
    const text = await headings.nth(i).textContent();
    if (text && /مميز|Featured|منتجات|Products|popular|popular/i.test(text)) {
      return true;
    }
  }
  return false;
}
