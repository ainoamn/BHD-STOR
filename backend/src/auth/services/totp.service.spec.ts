import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { TotpService } from './totp.service';
import { UsersService } from '@users/users.service';

describe('TotpService', () => {
  let service: TotpService;
  let usersService: {
    getUserSecurity: jest.Mock;
    saveTwoFactorState: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    usersService = {
      getUserSecurity: jest.fn(),
      saveTwoFactorState: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        { provide: UsersService, useValue: usersService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              const map: Record<string, string> = {
                JWT_SECRET: 'test-jwt-secret-for-totp',
                API_KEY_PEPPER: 'test-pepper',
                TOTP_ISSUER: 'BHD Test',
              };
              return map[key] ?? fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(TotpService);
  });

  it('encrypts and decrypts secrets (roundtrip)', () => {
    const plain = authenticator.generateSecret();
    const encrypted = service.encryptSecret(plain);
    expect(encrypted.split(':')).toHaveLength(3);
    expect(service.decryptSecret(encrypted)).toBe(plain);
  });

  it('verifyLoginCode rejects a bad TOTP code', async () => {
    const secret = authenticator.generateSecret();
    usersService.getUserSecurity.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      twoFactorEnabled: true,
      twoFactorSecret: service.encryptSecret(secret),
      twoFactorTempSecret: null,
      twoFactorBackupHashes: null,
    });

    await expect(service.verifyLoginCode(userId, '000000')).resolves.toBe(false);
  });

  it('enable rejects invalid code against temp secret', async () => {
    const secret = authenticator.generateSecret();
    usersService.getUserSecurity.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorTempSecret: service.encryptSecret(secret),
      twoFactorBackupHashes: null,
    });

    await expect(service.enable(userId, '000000')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
