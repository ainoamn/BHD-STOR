import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '@users/users.service';

describe('AuthService password reset & revocation', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let redis: { set: jest.Mock; get: jest.Mock };

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: '$2b$12$hashed',
    role: 'customer',
    isActive: true,
    isEmailVerified: true,
    resetToken: null as string | null,
    resetTokenExpiry: null as Date | null,
  };

  const configService = {
    get: jest.fn((key: string, fallback?: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
        JWT_ISSUER: 'bhd-oman-marketplace',
        JWT_AUDIENCE: 'bhd-oman-api',
        AES_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
        NODE_ENV: 'test',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key] ?? fallback;
    }),
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt'),
    verifyAsync: jest.fn(),
    decode: jest.fn().mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      updateResetToken: jest.fn().mockResolvedValue(undefined),
      clearResetToken: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      findByResetTokenSelector: jest.fn(),
    };

    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
    };

    // Construct directly so we can inject a Redis mock without getRedisToken().
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      redis as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('forgotPassword / resetPassword', () => {
    it('stores selector:sha256(verifier) and returns raw token in non-production', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toMatch(/password reset link/i);
      expect(result.resetToken).toMatch(/^[a-f0-9]{16}\.[a-f0-9]{64}$/);

      const [selector, verifier] = result.resetToken!.split('.');
      const expectedHash = crypto.createHash('sha256').update(verifier).digest('hex');
      expect(usersService.updateResetToken).toHaveBeenCalledWith(
        mockUser.id,
        `${selector}:${expectedHash}`,
        expect.any(Date),
      );
    });

    it('returns generic message without leaking existence for unknown email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const result = await service.forgotPassword('nobody@example.com');

      expect(result.resetToken).toBeUndefined();
      expect(usersService.updateResetToken).not.toHaveBeenCalled();
    });

    it('resets password when selector.verifier matches stored hash', async () => {
      const selector = 'a'.repeat(16);
      const verifier = 'b'.repeat(64);
      const hash = crypto.createHash('sha256').update(verifier).digest('hex');
      const rawToken = `${selector}.${verifier}`;

      usersService.findByResetTokenSelector!.mockResolvedValue({
        ...mockUser,
        resetToken: `${selector}:${hash}`,
        resetTokenExpiry: new Date(Date.now() + 60_000),
      } as any);

      const result = await service.resetPassword({
        token: rawToken,
        newPassword: 'NewPass123',
      });

      expect(result.message).toMatch(/reset successfully/i);
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        expect.stringMatching(/^\$2[aby]\$/),
      );
      expect(usersService.clearResetToken).toHaveBeenCalledWith(mockUser.id);
      expect(redis.set).toHaveBeenCalledWith(
        `auth:revoke:user:${mockUser.id}`,
        expect.any(String),
        'EX',
        expect.any(Number),
      );
    });

    it('rejects wrong verifier', async () => {
      const selector = 'a'.repeat(16);
      const hash = crypto.createHash('sha256').update('c'.repeat(64)).digest('hex');

      usersService.findByResetTokenSelector!.mockResolvedValue({
        ...mockUser,
        resetToken: `${selector}:${hash}`,
        resetTokenExpiry: new Date(Date.now() + 60_000),
      } as any);

      await expect(
        service.resetPassword({
          token: `${selector}.${'b'.repeat(64)}`,
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects expired tokens', async () => {
      const selector = 'a'.repeat(16);
      const verifier = 'b'.repeat(64);
      const hash = crypto.createHash('sha256').update(verifier).digest('hex');

      usersService.findByResetTokenSelector!.mockResolvedValue({
        ...mockUser,
        resetToken: `${selector}:${hash}`,
        resetTokenExpiry: new Date(Date.now() - 1000),
      } as any);

      await expect(
        service.resetPassword({
          token: `${selector}.${verifier}`,
          newPassword: 'NewPass123',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(usersService.clearResetToken).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('token blacklist / revoke', () => {
    it('blacklists token in Redis with TTL', async () => {
      await service.blacklistToken('access.jwt.token');

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:blacklist:[a-f0-9]{64}$/),
        '1',
        'EX',
        expect.any(Number),
      );

      redis.get.mockResolvedValue('1');
      await expect(service.isTokenBlacklisted('access.jwt.token')).resolves.toBe(true);
    });

    it('treats tokens issued before revoke timestamp as revoked', async () => {
      const revokedAt = Date.now();
      redis.get.mockResolvedValue(String(revokedAt));

      const iatBefore = Math.floor(revokedAt / 1000) - 10;
      const iatAfter = Math.floor(revokedAt / 1000) + 10;

      await expect(service.areUserTokensRevoked(mockUser.id, iatBefore)).resolves.toBe(true);
      await expect(service.areUserTokensRevoked(mockUser.id, iatAfter)).resolves.toBe(false);
    });

    it('falls back to memory when Redis is unavailable', async () => {
      redis.set.mockRejectedValue(new Error('redis down'));
      redis.get.mockRejectedValue(new Error('redis down'));

      await service.blacklistToken('mem-token');
      await expect(service.isTokenBlacklisted('mem-token')).resolves.toBe(true);

      await service.revokeRefreshTokens(mockUser.id);
      const iatBefore = Math.floor(Date.now() / 1000) - 5;
      await expect(service.areUserTokensRevoked(mockUser.id, iatBefore)).resolves.toBe(true);
    });
  });

  describe('Nest wiring', () => {
    it('boots AuthService without Redis (memory fallback)', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: UsersService, useValue: usersService },
          { provide: JwtService, useValue: jwtService },
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const wired = module.get(AuthService);
      usersService.findByEmail!.mockResolvedValue(null);
      await expect(wired.forgotPassword('x@y.com')).resolves.toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/password reset link/i),
        }),
      );
    });
  });
});
