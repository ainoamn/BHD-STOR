import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '@users/users.service';
import { UserRole, UserStatus } from '@users/entities/user.entity';

describe('AuthService.loginWithBhdIdentity', () => {
  let service: AuthService;
  let usersService: {
    findByBhdSub: jest.Mock;
    findByEmail: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateLastLogin: jest.Mock;
  };

  const identity = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    picture: 'https://cdn.example.com/ada.png',
    phone: null as string | null,
  };

  const existing = {
    id: 'local-user-1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: UserRole.CUSTOMER,
    avatar: null,
    phone: null,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    bhdSub: null as string | null,
    isActive: true,
  };

  beforeEach(() => {
    usersService = {
      findByBhdSub: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      { signAsync: jest.fn().mockResolvedValue('jwt') } as unknown as JwtService,
      {
        get: jest.fn((key: string, fallback?: string) => {
          const config: Record<string, string> = {
            JWT_SECRET: 'test-jwt-secret',
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_EXPIRES_IN: '15m',
            JWT_REFRESH_EXPIRES_IN: '7d',
            JWT_ISSUER: 'bhd-oman-marketplace',
            JWT_AUDIENCE: 'bhd-oman-api',
            AES_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
          };
          return config[key] ?? fallback;
        }),
      } as unknown as ConfigService,
      {} as never,
    );
  });

  it('creates a customer with bhd_sub and does not grant admin/seller', async () => {
    usersService.create.mockImplementation(async (data: Record<string, unknown>) => ({
      ...existing,
      ...data,
      id: 'new-user',
      isActive: true,
    }));

    const result = await service.loginWithBhdIdentity(identity);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        bhdSub: identity.sub,
      }),
    );
    expect(result.user?.role).toBe(UserRole.CUSTOMER);
    expect(result.tokens?.accessToken).toBe('jwt');
  });

  it('links a verified local email instead of creating a second row', async () => {
    usersService.findByEmail.mockResolvedValue(existing);
    usersService.findOne.mockResolvedValue(existing);
    usersService.update.mockResolvedValue({ ...existing, bhdSub: identity.sub });

    await service.loginWithBhdIdentity(identity);

    expect(usersService.create).not.toHaveBeenCalled();
    expect(usersService.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ bhdSub: identity.sub, emailVerified: true }),
    );
  });

  it('refuses to link an unverified local email', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...existing,
      emailVerified: false,
    });

    await expect(service.loginWithBhdIdentity(identity)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usersService.create).not.toHaveBeenCalled();
  });
});
