/**
 * Load .env before AppModule evaluates feature flags.
 * Must be imported first from main.ts.
 */
import { existsSync } from 'fs';
import { resolve } from 'path';

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv') as typeof import('dotenv');
  const root = process.cwd();
  for (const name of ['.env', '.env.local']) {
    const path = resolve(root, name);
    if (existsSync(path)) {
      dotenv.config({ path, override: false });
    }
  }
} catch {
  // dotenv optional at compile-time; ConfigModule still loads env later for DI
}
