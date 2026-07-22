import { ConfigService } from '@nestjs/config';
import { assertProductionSecrets } from './assert-production-secrets';

function mockConfig(map: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => map[key],
  } as ConfigService;
}

describe('assertProductionSecrets', () => {
  it('allows weak secrets outside production', () => {
    expect(() =>
      assertProductionSecrets(
        mockConfig({
          NODE_ENV: 'development',
          JWT_SECRET: 'short',
        }),
      ),
    ).not.toThrow();
  });

  it('rejects weak JWT in production', () => {
    expect(() =>
      assertProductionSecrets(
        mockConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'your-jwt-secret-key-change-in-production',
          JWT_REFRESH_SECRET: 'a'.repeat(40),
          ENCRYPTION_MASTER_KEY: 'ab'.repeat(32),
        }),
      ),
    ).toThrow(/Unsafe production configuration/);
  });

  it('accepts strong production secrets', () => {
    expect(() =>
      assertProductionSecrets(
        mockConfig({
          NODE_ENV: 'production',
          JWT_SECRET: 'a'.repeat(40),
          JWT_REFRESH_SECRET: 'b'.repeat(40),
          ENCRYPTION_MASTER_KEY: 'ab'.repeat(32),
        }),
      ),
    ).not.toThrow();
  });
});
