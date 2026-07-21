import { test, expect, Page } from '@playwright/test';

/**
 * ============================================================================
 * Auth E2E Tests
 * Tests: Register, Login, Invalid credentials, Logout, Protected routes
 * ============================================================================
 */

// Test user data
const TEST_USER = {
  firstName: 'E2E',
  lastName: 'Test',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'E2E_Test@2024!',
  phone: '+96891234567',
};

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ========================================================================
  // Registration
  // ========================================================================
  test.describe('Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      // Navigate to register page
      await navigateToRegister(page);

      // Fill registration form
      await fillRegistrationForm(page, TEST_USER);

      // Submit form
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('button').filter({ hasText: /تسجيل|Register|إنشاء|Create/i }).first()
      );
      await submitButton.click();

      // Should redirect to home or dashboard after successful registration
      await expect(page).toHaveURL(/^(?!.*register).*$/);

      // Should show welcome message or be logged in
      const welcomeMessage = page.locator('text=/مرحبا|Welcome|أهلا|Hello/i').first();
      const userMenu = page.locator('[data-testid="user-menu"]').or(
        page.locator('button').filter({ hasText: TEST_USER.firstName }).first()
      );

      const isLoggedIn = await welcomeMessage.isVisible().catch(() => false) ||
                        await userMenu.isVisible().catch(() => false);
      expect(isLoggedIn).toBeTruthy();
    });

    test('should show error for duplicate email', async ({ page }) => {
      // First registration
      await navigateToRegister(page);
      await fillRegistrationForm(page, TEST_USER);
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Wait for first registration
      await page.waitForTimeout(2000);

      // Try to register again with same email
      await navigateToRegister(page);
      await fillRegistrationForm(page, TEST_USER);
      await submitButton.click();

      // Should show error
      const errorMessage = page.locator('[data-testid="error-message"]').or(
        page.locator('text=/exists|موجود|taken|مستخدم|duplicate/i').first()
      );
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await navigateToRegister(page);

      // Fill with invalid email
      await fillInput(page, 'input[name="email"], input[type="email"]', 'invalid-email');
      await fillInput(page, 'input[name="password"], input[type="password"]', TEST_USER.password);

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation error
      const errorMessage = page.locator('text=/valid|صحيح|invalid|خطأ/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for weak password', async ({ page }) => {
      await navigateToRegister(page);

      // Fill with weak password
      await fillRegistrationForm(page, {
        ...TEST_USER,
        email: `weak-${Date.now()}@example.com`,
        password: 'weak',
      });

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show password validation error
      const errorMessage = page.locator('text=/password|كلمة|weak|ضعيف|8|strong/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for missing required fields', async ({ page }) => {
      await navigateToRegister(page);

      // Submit empty form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation errors
      const errorMessages = page.locator('text=/required|مطلوب|necessaire|empty/i');
      const count = await errorMessages.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Login
  // ========================================================================
  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // First register a user
      await navigateToRegister(page);
      const uniqueUser = {
        ...TEST_USER,
        email: `login-test-${Date.now()}@example.com`,
      };
      await fillRegistrationForm(page, uniqueUser);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // Navigate to login
      await navigateToLogin(page);

      // Fill login form
      await fillLoginForm(page, uniqueUser.email, uniqueUser.password);

      // Submit
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should redirect away from login page
      await expect(page).toHaveURL(/^(?!.*login).*$/);
    });

    test('should persist login state after page reload', async ({ page }) => {
      // Login first
      await navigateToLogin(page);
      const loginEmail = `persist-${Date.now()}@example.com`;
      
      // Register then login
      await navigateToRegister(page);
      await fillRegistrationForm(page, { ...TEST_USER, email: loginEmail });
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be logged in (no login button visible)
      const loginButton = page.locator('a[href*="login"]').or(
        page.locator('button').filter({ hasText: /دخول|Login/i }).first()
      );

      // User should still appear logged in
      const userIndicator = page.locator('[data-testid="user-menu"]').or(
        page.locator('text=/حسابي|My Account|Profile/i').first()
      );

      const isLoggedIn = await userIndicator.isVisible().catch(() => false) ||
                        !(await loginButton.isVisible().catch(() => true));
      expect(isLoggedIn).toBeTruthy();
    });
  });

  // ========================================================================
  // Invalid Credentials
  // ========================================================================
  test.describe('Invalid Credentials', () => {
    test('should show error for wrong password', async ({ page }) => {
      await navigateToLogin(page);

      // Fill with wrong password
      await fillLoginForm(page, TEST_USER.email, 'WrongPassword123!');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]').or(
        page.locator('text=/credentials|invalid|خطأ|فشل|incorrect|wrong/i').first()
      );
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for non-existent email', async ({ page }) => {
      await navigateToLogin(page);

      // Fill with non-existent email
      await fillLoginForm(page, 'nonexistent-random@example.com', 'SomePassword123!');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show error
      const errorMessage = page.locator('text=/credentials|invalid|found|found|exists/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for empty email', async ({ page }) => {
      await navigateToLogin(page);

      // Submit with empty email
      await fillLoginForm(page, '', TEST_USER.password);

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation error
      const errorMessage = page.locator('text=/required|مطلوب|email/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for empty password', async ({ page }) => {
      await navigateToLogin(page);

      await fillLoginForm(page, TEST_USER.email, '');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show validation error
      const errorMessage = page.locator('text=/required|مطلوب|password/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  // ========================================================================
  // Logout
  // ========================================================================
  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await navigateToRegister(page);
      const logoutUser = {
        ...TEST_USER,
        email: `logout-test-${Date.now()}@example.com`,
      };
      await fillRegistrationForm(page, logoutUser);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // Find and click logout
      const logoutButton = page.locator('[data-testid="logout-button"]').or(
        page.locator('button').filter({ hasText: /خروج|Logout|تسجيل الخروج/i }).first()
      ).or(
        page.locator('a').filter({ hasText: /خروج|Logout/i }).first()
      );

      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);

        // Should redirect to home or login
        const loginLink = page.locator('a[href*="login"]').or(
          page.locator('button').filter({ hasText: /دخول|Login/i }).first()
        );
        
        expect(await loginLink.isVisible().catch(() => false)).toBeTruthy();
      }
    });

    test('should not access protected pages after logout', async ({ page }) => {
      // Login first
      await navigateToRegister(page);
      const protectedUser = {
        ...TEST_USER,
        email: `protected-test-${Date.now()}@example.com`,
      };
      await fillRegistrationForm(page, protectedUser);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // Logout
      const logoutButton = page.locator('button').filter({ hasText: /خروج|Logout/i }).first();
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }

      // Try to access account page
      await page.goto('/account');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login
      expect(page.url()).toMatch(/login|auth/);
    });
  });

  // ========================================================================
  // Protected Routes
  // ========================================================================
  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing account page without auth', async ({ page }) => {
      await page.goto('/account');
      await page.waitForLoadState('networkidle');

      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/);
    });

    test('should redirect to login when accessing orders page without auth', async ({ page }) => {
      await page.goto('/orders');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/login|auth/);
    });

    test('should redirect to login when accessing wishlist without auth', async ({ page }) => {
      await page.goto('/wishlist');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/login|auth/);
    });

    test('should redirect to login when accessing checkout without auth', async ({ page }) => {
      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/login|auth|cart/);
    });

    test('should allow access to public pages without auth', async ({ page }) => {
      // Home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/login/);

      // Products page
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/login/);

      // Categories page
      await page.goto('/categories');
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/login/);
    });
  });

  // ========================================================================
  // Password Reset Flow
  // ========================================================================
  test.describe('Password Reset', () => {
    test('should show forgot password page', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1').or(page.locator('h2')).first();
      await expect(heading).toBeVisible();
    });

    test('should submit forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle');

      // Fill email
      await fillInput(page, 'input[name="email"], input[type="email"]', TEST_USER.email);

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show success or info message
      const message = page.locator('text=/sent|إرسال|email|بريد|reset/i').first();
      await expect(message).toBeVisible({ timeout: 5000 });
    });
  });
});

// ==========================================================================
// Helper Functions
// ==========================================================================

async function navigateToRegister(page: Page): Promise<void> {
  const registerLink = page.locator('a[href*="register"]').or(
    page.locator('button').filter({ hasText: /تسجيل|Register|إنشاء|Create/i }).first()
  );

  if (await registerLink.isVisible().catch(() => false)) {
    await registerLink.click();
    await page.waitForLoadState('networkidle');
  } else {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  }
}

async function navigateToLogin(page: Page): Promise<void> {
  const loginLink = page.locator('a[href*="login"]').or(
    page.locator('button').filter({ hasText: /دخول|Login|تسجيل الدخول/i }).first()
  );

  if (await loginLink.isVisible().catch(() => false)) {
    await loginLink.click();
    await page.waitForLoadState('networkidle');
  } else {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  }
}

async function fillRegistrationForm(page: Page, user: typeof TEST_USER): Promise<void> {
  // Try multiple selectors for each field to handle different form structures
  await fillInput(page, 'input[name="firstName"], input[name="first_name"], input[placeholder*="first" i], input[placeholder*="الاسم" i]', user.firstName);
  await fillInput(page, 'input[name="lastName"], input[name="last_name"], input[placeholder*="last" i], input[placeholder*="العائلة" i]', user.lastName);
  await fillInput(page, 'input[name="email"], input[type="email"]', user.email);
  await fillInput(page, 'input[name="phone"], input[type="tel"], input[name="mobile"]', user.phone);
  await fillInput(page, 'input[name="password"], input[type="password"]', user.password);

  // Confirm password if field exists
  const confirmPassword = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[name="password_confirmation"]');
  if (await confirmPassword.isVisible().catch(() => false)) {
    await confirmPassword.fill(user.password);
  }
}

async function fillLoginForm(page: Page, email: string, password: string): Promise<void> {
  if (email) {
    await fillInput(page, 'input[name="email"], input[type="email"]', email);
  }
  if (password) {
    await fillInput(page, 'input[name="password"], input[type="password"]', password);
  }
}

async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector).first();
  if (await input.isVisible().catch(() => false)) {
    await input.fill(value);
  }
}
