import { defineConfig, devices } from '@playwright/test';

/**
 * ============================================================================
 * BHD Oman Marketplace - Playwright E2E Configuration
 * Multi-browser, RTL support, screenshot/video capture on failure
 * ============================================================================
 */

export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Output directory for test artifacts
  outputDir: './test-results',

  // Test files pattern
  testMatch: '**/*.spec.ts',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Number of workers
  workers: process.env.CI ? 3 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: './playwright-report' }],
    ['json', { outputFile: './test-results/results.json' }],
    ['list'],
    ...(process.env.CI ? [['github'] as [string]] : []),
  ],

  // Global test timeout
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 10 * 1000,
  },

  // Global setup and teardown
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // API URL for backend requests
    apiURL: process.env.API_URL || 'http://localhost:3001/api/v1',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording on failure
    video: 'on-first-retry',

    // Locale and timezone
    locale: 'ar-OM',
    timezoneId: 'Asia/Muscat',

    // Action timeout
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'ar,en;q=0.9',
    },

    // Storage state (logged in state)
    storageState: undefined,
  },

  // Configure projects for major browsers
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: '**/*.setup.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Chromium (Desktop)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
      dependencies: ['setup'],
    },

    // Chromium (Desktop HD)
    {
      name: 'chromium-hd',
      use: {
        ...devices['Desktop Chrome HiDPI'],
      },
      dependencies: ['setup'],
    },

    // Firefox
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    // WebKit (Safari)
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },

    // Mobile Chrome (Responsive)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },

    // Mobile Safari (iPhone)
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14 Pro Max'],
      },
      dependencies: ['setup'],
    },

    // Tablet (iPad)
    {
      name: 'tablet',
      use: {
        ...devices['iPad (gen 7) landscape'],
      },
      dependencies: ['setup'],
    },

    // RTL-specific tests (Arabic layout)
    {
      name: 'chromium-rtl',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ar-OM',
        isMobile: false,
      },
      testMatch: '**/*rtl*.spec.ts',
      dependencies: ['setup'],
    },

    // Smoke tests (critical path only)
    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: '**/smoke/**/*.spec.ts',
      retries: 0,
      workers: 1,
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:3001/api/v1',
    },
  },
});
