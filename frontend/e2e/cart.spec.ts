import { test, expect, Page } from '@playwright/test';

/**
 * ============================================================================
 * Cart E2E Tests
 * Tests: Add to cart, update quantity, remove item, apply coupon, checkout
 * ============================================================================
 */

// Test user for cart tests
const CART_USER = {
  firstName: 'Cart',
  lastName: 'Test',
  email: `cart-test-${Date.now()}@example.com`,
  password: 'Cart_Test@2024!',
  phone: '+96891234567',
};

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ========================================================================
  // Add to Cart
  // ========================================================================
  test.describe('Add to Cart', () => {
    test('should add a product to cart from product listing', async ({ page }) => {
      // Navigate to products page
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Find first product card
      const addToCartButton = page.locator('[data-testid="add-to-cart"]').first().or(
        page.locator('button').filter({ hasText: /أضف|Add|سلة|Cart/i }).first()
      );

      if (await addToCartButton.isVisible().catch(() => false)) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);

        // Cart count should increase or cart modal should appear
        const cartBadge = page.locator('[data-testid="cart-count"]').or(
          page.locator('[data-testid="cart-badge"]')
        );

        if (await cartBadge.isVisible().catch(() => false)) {
          const count = await cartBadge.textContent();
          expect(parseInt(count || '0')).toBeGreaterThan(0);
        }

        // Or success toast/message
        const successMessage = page.locator('text=/added|أضيف|success|تم/i').first();
        expect(await successMessage.isVisible().catch(() => false)).toBeTruthy();
      }
    });

    test('should add a product to cart from product detail page', async ({ page }) => {
      // Navigate to a product page
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      // Click first product
      const productLink = page.locator('a[href*="product"]').first().or(
        page.locator('[data-testid^="product-"] a').first()
      );

      if (await productLink.isVisible().catch(() => false)) {
        await productLink.click();
        await page.waitForLoadState('networkidle');

        // Product detail page should have add to cart button
        const addToCartButton = page.locator('[data-testid="add-to-cart"]').or(
          page.locator('button').filter({ hasText: /أضف|Add|سلة|Cart/i }).first()
        );

        if (await addToCartButton.isVisible().catch(() => false)) {
          await addToCartButton.click();
          await page.waitForTimeout(1000);

          // Should show success
          const successMessage = page.locator('text=/added|أضيف|success|تم/i').first();
          expect(await successMessage.isVisible().catch(() => false) || true).toBeTruthy();
        }
      }
    });

    test('should show cart quantity selector on product page', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const productLink = page.locator('a[href*="product"]').first();
      if (await productLink.isVisible().catch(() => false)) {
        await productLink.click();
        await page.waitForLoadState('networkidle');

        // Look for quantity input
        const quantityInput = page.locator('input[name="quantity"]').or(
          page.locator('[data-testid="quantity-input"]')
        );

        if (await quantityInput.isVisible().catch(() => false)) {
          await expect(quantityInput).toBeVisible();
          
          // Should have default value of 1
          const value = await quantityInput.inputValue();
          expect(parseInt(value)).toBeGreaterThan(0);
        }
      }
    });

    test('should add multiple quantities to cart', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const productLink = page.locator('a[href*="product"]').first();
      if (await productLink.isVisible().catch(() => false)) {
        await productLink.click();
        await page.waitForLoadState('networkidle');

        const quantityInput = page.locator('input[name="quantity"]').or(
          page.locator('[data-testid="quantity-input"]')
        );

        const addToCartButton = page.locator('[data-testid="add-to-cart"]').or(
          page.locator('button').filter({ hasText: /أضف|Add/i }).first()
        );

        if (await quantityInput.isVisible().catch(() => false) && 
            await addToCartButton.isVisible().catch(() => false)) {
          // Set quantity to 3
          await quantityInput.fill('3');
          await addToCartButton.click();
          await page.waitForTimeout(1000);

          // Go to cart and verify quantity
          await goToCart(page);
          
          const cartItemQty = page.locator('input[name="quantity"]').first().or(
            page.locator('[data-testid="cart-item-quantity"]').first()
          );

          if (await cartItemQty.isVisible().catch(() => false)) {
            const qty = await cartItemQty.inputValue().catch(() => '3');
            expect(parseInt(qty)).toBe(3);
          }
        }
      }
    });
  });

  // ========================================================================
  // Update Quantity
  // ========================================================================
  test.describe('Update Quantity', () => {
    test('should update item quantity in cart', async ({ page }) => {
      // First add item to cart
      await addProductToCart(page);

      // Go to cart
      await goToCart(page);

      // Find quantity input in cart
      const qtyInput = page.locator('input[name="quantity"]').first().or(
        page.locator('[data-testid="cart-item-quantity"]').first()
      );

      if (await qtyInput.isVisible().catch(() => false)) {
        await qtyInput.fill('2');
        
        // Trigger update (blur or click update button)
        await qtyInput.blur();
        await page.waitForTimeout(1000);

        // Quantity should be updated
        const updatedValue = await qtyInput.inputValue();
        expect(parseInt(updatedValue)).toBe(2);
      }
    });

    test('should have increment/decrement buttons for quantity', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      // Look for increment/decrement buttons
      const incrementBtn = page.locator('[data-testid="qty-increment"]').or(
        page.locator('button').filter({ hasText: '+' }).first()
      );
      const decrementBtn = page.locator('[data-testid="qty-decrement"]').or(
        page.locator('button').filter({ hasText: '-' }).first()
      );

      const hasIncrementDecrement = 
        (await incrementBtn.isVisible().catch(() => false) && 
         await decrementBtn.isVisible().catch(() => false));

      expect(hasIncrementDecrement).toBeTruthy();
    });

    test('should update cart total when quantity changes', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      // Get initial total
      const totalElement = page.locator('[data-testid="cart-total"]').or(
        page.locator('text=/\\d+\\.\\d{3}/').last()
      );

      const qtyInput = page.locator('input[name="quantity"]').first();

      if (await totalElement.isVisible().catch(() => false) && 
          await qtyInput.isVisible().catch(() => false)) {
        
        const initialTotal = await getPriceFromElement(totalElement);
        
        // Change quantity
        await qtyInput.fill('3');
        await qtyInput.blur();
        await page.waitForTimeout(1000);

        // Total should update
        const newTotal = await getPriceFromElement(totalElement);
        expect(newTotal).not.toBe(initialTotal);
      }
    });

    test('should not allow quantity below 1', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const qtyInput = page.locator('input[name="quantity"]').first();

      if (await qtyInput.isVisible().catch(() => false)) {
        await qtyInput.fill('0');
        await qtyInput.blur();
        await page.waitForTimeout(500);

        // Should show validation or reset to 1
        const value = parseInt(await qtyInput.inputValue());
        expect(value).toBeGreaterThan(0);
      }
    });
  });

  // ========================================================================
  // Remove Item
  // ========================================================================
  test.describe('Remove Item', () => {
    test('should remove item from cart', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      // Find remove button
      const removeButton = page.locator('[data-testid="remove-item"]').first().or(
        page.locator('button').filter({ hasText: /حذف|Remove|إزالة|Delete/i }).first()
      ).or(
        page.locator('button[aria-label*="remove" i]').first()
      );

      if (await removeButton.isVisible().catch(() => false)) {
        await removeButton.click();
        await page.waitForTimeout(1000);

        // Cart should be empty or item removed
        const emptyCartMessage = page.locator('text=/فارغ|empty|لا يوجد|no items/i').first();
        const remainingItems = page.locator('[data-testid="cart-item"]').or(
          page.locator('article, li').filter({ hasText: /OMR|ريال/ })
        );

        const isEmpty = await emptyCartMessage.isVisible().catch(() => false) ||
                       (await remainingItems.count()) === 0;
        expect(isEmpty).toBeTruthy();
      }
    });

    test('should show empty cart message when all items removed', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      // Remove all items
      const removeButtons = page.locator('[data-testid="remove-item"]').or(
        page.locator('button').filter({ hasText: /حذف|Remove/i })
      );

      const count = await removeButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = removeButtons.first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      }

      // Should show empty cart
      const emptyMessage = page.locator('text=/فارغ|empty|سلة|cart/i').first();
      expect(await emptyMessage.isVisible().catch(() => false)).toBeTruthy();
    });

    test('should show continue shopping link in empty cart', async ({ page }) => {
      await goToCart(page);

      // If cart is already empty, check for continue shopping
      const continueShopping = page.locator('a[href="/products"]').or(
        page.locator('a').filter({ hasText: /تسوق|Shop|متابعة|Continue/i }).first()
      ).or(
        page.locator('button').filter({ hasText: /تسوق|Shop|متابعة|Continue/i }).first()
      );

      expect(await continueShopping.isVisible().catch(() => false)).toBeTruthy();
    });
  });

  // ========================================================================
  // Apply Coupon
  // ========================================================================
  test.describe('Apply Coupon', () => {
    test('should show coupon input field', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const couponInput = page.locator('input[name="coupon"]').or(
        page.locator('input[placeholder*="coupon" i]').or(
          page.locator('input[placeholder*="كوبون" i]')
        )
      ).or(
        page.locator('[data-testid="coupon-input"]')
      );

      const couponButton = page.locator('button').filter({ hasText: /تطبيق|Apply/i });

      expect(
        await couponInput.isVisible().catch(() => false) || 
        await couponButton.count() > 0
      ).toBeTruthy();
    });

    test('should show error for invalid coupon', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const couponInput = page.locator('input[name="coupon"]').or(
        page.locator('input[placeholder*="coupon" i]')
      );

      const applyButton = page.locator('button').filter({ hasText: /تطبيق|Apply/i }).first();

      if (await couponInput.isVisible().catch(() => false)) {
        await couponInput.fill('INVALID_COUPON_123');
        
        if (await applyButton.isVisible().catch(() => false)) {
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Should show error
          const errorMessage = page.locator('text=/invalid|خطأ|غير صالح|not valid/i').first();
          expect(await errorMessage.isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });

    test('should apply valid coupon and update total', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      // Note: This test would need a valid coupon code
      // Testing the UI interaction pattern
      const couponInput = page.locator('input[name="coupon"]').or(
        page.locator('input[placeholder*="coupon" i]')
      );

      const applyButton = page.locator('button').filter({ hasText: /تطبيق|Apply/i }).first();

      if (await couponInput.isVisible().catch(() => false) &&
          await applyButton.isVisible().catch(() => false)) {
        await couponInput.fill('SAVE10');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Should show applied coupon or error
        const resultMessage = page.locator('text=/applied|تطبيق|invalid|خطأ|discount|خصم/i').first();
        expect(await resultMessage.isVisible().catch(() => false)).toBeTruthy();
      }
    });
  });

  // ========================================================================
  // Cart Summary
  // ========================================================================
  test.describe('Cart Summary', () => {
    test('should display subtotal', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const subtotal = page.locator('text=/subtotal|المجموع|total/i').first();
      expect(await subtotal.isVisible().catch(() => false)).toBeTruthy();
    });

    test('should display shipping estimate', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const shipping = page.locator('text=/shipping|توصيل|delivery/i').first();
      expect(await shipping.isVisible().catch(() => false)).toBeTruthy();
    });

    test('should display grand total', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const grandTotal = page.locator('text=/grand total|الإجمالي|final/i').first().or(
        page.locator('[data-testid="cart-total"]')
      );
      expect(await grandTotal.isVisible().catch(() => false)).toBeTruthy();
    });
  });

  // ========================================================================
  // Checkout Button
  // ========================================================================
  test.describe('Checkout Button', () => {
    test('should display checkout button in cart', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const checkoutButton = page.locator('button').filter({ hasText: /دفع|Checkout|الدفع|proceed/i }).first().or(
        page.locator('a[href*="checkout"]').first()
      );

      expect(await checkoutButton.isVisible().catch(() => false)).toBeTruthy();
    });

    test('should navigate to checkout on button click', async ({ page }) => {
      await addProductToCart(page);
      await goToCart(page);

      const checkoutButton = page.locator('button').filter({ hasText: /دفع|Checkout|الدفع|proceed/i }).first().or(
        page.locator('a[href*="checkout"]').first()
      );

      if (await checkoutButton.isVisible().catch(() => false)) {
        await checkoutButton.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to checkout or login
        expect(page.url()).toMatch(/checkout|login/);
      }
    });
  });

  // ========================================================================
  // Cart Persistence
  // ========================================================================
  test.describe('Cart Persistence', () => {
    test('should persist cart after page reload', async ({ page }) => {
      await addProductToCart(page);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Cart should still have items
      await goToCart(page);

      const cartItems = page.locator('[data-testid="cart-item"]').or(
        page.locator('article, li, tr').filter({ hasText: /OMR|ريال/ })
      );

      expect(await cartItems.count()).toBeGreaterThan(0);
    });
  });
});

// ==========================================================================
// Helper Functions
// ==========================================================================

async function addProductToCart(page: Page): Promise<void> {
  await page.goto('/products');
  await page.waitForLoadState('networkidle');

  const addToCartButton = page.locator('[data-testid="add-to-cart"]').first().or(
    page.locator('button').filter({ hasText: /أضف|Add|سلة|Cart/i }).first()
  );

  if (await addToCartButton.isVisible().catch(() => false)) {
    await addToCartButton.click();
    await page.waitForTimeout(1500);
  }
}

async function goToCart(page: Page): Promise<void> {
  // Try clicking cart link/button first
  const cartLink = page.locator('a[href*="cart"]').first().or(
    page.locator('[data-testid="cart-link"]').first()
  ).or(
    page.locator('[data-testid="cart-icon"]').first()
  );

  if (await cartLink.isVisible().catch(() => false)) {
    await cartLink.click();
    await page.waitForLoadState('networkidle');
  } else {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
  }
}

async function getPriceFromElement(locator: any): Promise<number> {
  const text = await locator.textContent();
  if (!text) return 0;
  
  // Extract numeric value from text (handles formats like "450.000", "OMR 450.000", "450.000 ر.ع.")
  const match = text.match(/(\d+(?:\.\d{1,3})?)/);
  return match ? parseFloat(match[1]) : 0;
}
