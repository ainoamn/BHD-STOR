import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

/**
 * Minimal auth setup so projects that depend on `setup` do not fail
 * when no real login flow is wired yet. Writes an empty storage state.
 */
setup('create empty storage state', async () => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(
    AUTH_FILE,
    JSON.stringify({ cookies: [], origins: [] }, null, 2),
  );
});
