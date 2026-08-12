import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

/**
 * ============================================================================
 * BHD Oman Marketplace - Playwright E2E Configuration
 * Multi-browser, RTL support, screenshot/video capture on failure
 * ============================================================================
 */

const smokeOnly = process.env.PLAYWRIGHT_SMOKE_ONLY === 'true';

const reporters: ReporterDescription[] = [
  ['html', { outputFolder: './playwright-report' }],
  ['json', { outputFile: './test-results/results.json' }],
  ['list'],
];

if (process.env.CI) {
  reporters.push(['github']);
}

const allProjects = [
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
      channel: 'chromium' as const,
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },

  // Chromium (Desktop HD)
  {
    name: 'chromium-hd',
    use: {
      ...devices['Desktop Chrome HiDPI'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },

  // Firefox
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },

  // WebKit (Safari)
  {
    name: 'webkit',
    use: {
      ...devices['Desktop Safari'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },

  // Mobile Chrome (Responsive)
  {
    name: 'mobile-chrome',
    use: {
      ...devices['Pixel 5'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },

  // Mobile Safari (iPhone)
  {
    name: 'mobile-safari',
    use: {
      ...devices['iPhone 14 Pro Max'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },

  // Tablet (iPad)
  {
    name: 'tablet',
    use: {
      ...devices['iPad (gen 7) landscape'],
      storageState: 'e2e/.auth/user.json',
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
      storageState: 'e2e/.auth/user.json',
    },
    testMatch: '**/*rtl*.spec.ts',
    dependencies: ['setup'],
  },

  // Smoke tests (critical path only) — no setup dependency
  {
    name: 'smoke',
    use: {
      ...devices['Desktop Chrome'],
    },
    testMatch: '**/smoke/**/*.spec.ts',
    retries: 0,
    workers: 1,
  },
];

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
  reporter: reporters,

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

    // Storage state (logged in state) — set per project when needed
    storageState: undefined,
  },

  // When PLAYWRIGHT_SMOKE_ONLY=true, only the smoke project runs
  projects: smokeOnly
    ? allProjects.filter((p) => p.name === 'smoke')
    : allProjects,

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        'http://localhost:3001/api/v1',
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || 'false',
    },
  },
});
