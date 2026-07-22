import { ConfigService } from '@nestjs/config';

const WEAK_SECRET_MARKERS = [
  'change-in-production',
  'change_me',
  'changeme',
  'your-jwt-secret',
  'dev_jwt_secret',
  'secret',
  'password',
  'test-jwt-secret',
];

function isWeakSecret(value: string | undefined, minLength: number): boolean {
  if (!value || value.trim().length < minLength) {
    return true;
  }
  const lower = value.trim().toLowerCase();
  return WEAK_SECRET_MARKERS.some((m) => lower.includes(m));
}

/**
 * Refuse to boot in production with placeholder / short secrets.
 * Safe to call after dotenv + ConfigModule are available.
 */
export function assertProductionSecrets(config: ConfigService): void {
  const nodeEnv = config.get<string>('NODE_ENV') || 'development';
  if (nodeEnv !== 'production') {
    return;
  }

  const problems: string[] = [];

  if (isWeakSecret(config.get<string>('JWT_SECRET'), 32)) {
    problems.push('JWT_SECRET must be a strong secret (≥32 chars, not a placeholder)');
  }
  if (isWeakSecret(config.get<string>('JWT_REFRESH_SECRET'), 32)) {
    problems.push(
      'JWT_REFRESH_SECRET must be a strong secret (≥32 chars, not a placeholder)',
    );
  }

  const enc = config.get<string>('ENCRYPTION_MASTER_KEY');
  if (!enc || !/^[0-9a-fA-F]{64}$/.test(enc.trim())) {
    problems.push('ENCRYPTION_MASTER_KEY must be 64 hex characters');
  }

  if (problems.length) {
    throw new Error(
      `Unsafe production configuration:\n- ${problems.join('\n- ')}\nRefusing to start.`,
    );
  }
}
