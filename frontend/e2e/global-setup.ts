/**
 * Playwright global setup — runs once before the test suite.
 * Logs BASE_URL for CI diagnostics; no-op otherwise.
 */
async function globalSetup(): Promise<void> {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`[playwright] globalSetup BASE_URL=${baseURL}`);
}

export default globalSetup;
