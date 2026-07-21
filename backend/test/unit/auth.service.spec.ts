import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { MailService } from '../../src/modules/mail/mail.service';
import { TokenService } from '../../src/modules/auth/token.service';

/**
 * ============================================================================
 * AuthService Unit Tests
 * Tests: register, login, logout, refreshTokens, forgotPassword, resetPassword
 * ============================================================================
 */

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let mailService: jest.Mocked<Partial<MailService>>;
  let tokenService: jest.Mocked<Partial<TokenService>>;

  // Mock user data
  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G', // hashed "password123"
    role: 'customer',
    status: 'active',
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-abc',
    expiresIn: 900,
  };

  beforeEach(async () => {
    // Create mocks
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
      sign: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        const config = {
          JWT_SECRET: 'test-jwt-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return config[key];
      }),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
    };

    tokenService = {
      generateTokens: jest.fn().mockResolvedValue(mockTokens),
      refreshTokens: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      }),
      revokeToken: jest.fn().mockResolvedValue(undefined),
      verifyRefreshToken: jest.fn(),
      createPasswordResetToken: jest.fn().mockResolvedValue('reset-token-123'),
      validatePasswordResetToken: jest.fn(),
      invalidateUserTokens: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: MailService, useValue: mailService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // REGISTER
  // ========================================================================
  describe('register()', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      phone: '+96891234567',
    };

    it('should create a new user, hash password, and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        password: expect.any(String),
      });

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phone: registerDto.phone,
          password: expect.any(String),
          role: 'customer',
        }),
      );

      // Verify password is hashed (not plaintext)
      const createCall = (usersService.create as jest.Mock).mock.calls[0][0];
      expect(createCall.password).not.toBe(registerDto.password);
      expect(createCall.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

      expect(tokenService.generateTokens).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should send welcome email after successful registration', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });

      await service.register(registerDto);

      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        registerDto.email,
        `${registerDto.firstName} ${registerDto.lastName}`,
      );
    });

    it('should not include password in response', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, password: 'hashed' });

      const result = await service.register(registerDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  // ========================================================================
  // LOGIN
  // ========================================================================
  describe('login()', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should validate credentials and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      tokenService.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({ ...loginDto, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        status: 'suspended',
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Account is suspended');
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Please verify your email');
    });

    it('should update lastLoginAt timestamp', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
        lastLoginAt: expect.any(Date),
      });
    });
  });

  // ========================================================================
  // LOGOUT
  // ========================================================================
  describe('logout()', () => {
    it('should invalidate tokens', async () => {
      const refreshToken = 'valid-refresh-token';

      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: mockUser.id,
        tokenId: 'token-id',
      });

      await service.logout(refreshToken);

      expect(tokenService.revokeToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should not throw for invalid token', async () => {
      tokenService.revokeToken.mockResolvedValue(undefined);

      await expect(service.logout('invalid-token')).resolves.not.toThrow();
    });
  });

  // ========================================================================
  // REFRESH TOKENS
  // ========================================================================
  describe('refreshTokens()', () => {
    it('should return new access token pair', async () => {
      const refreshToken = 'valid-refresh-token';
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      };

      tokenService.refreshTokens.mockResolvedValue(newTokens);

      const result = await service.refreshTokens(refreshToken);

      expect(tokenService.refreshTokens).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      tokenService.refreshTokens.mockRejectedValue(new UnauthorizedException('Refresh token expired'));

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      tokenService.refreshTokens.mockRejectedValue(new UnauthorizedException('Token has been revoked'));

      await expect(service.refreshTokens('revoked-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ========================================================================
  // FORGOT PASSWORD
  // ========================================================================
  describe('forgotPassword()', () => {
    it('should generate reset token for existing user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      tokenService.createPasswordResetToken.mockResolvedValue('reset-token-123');

      const result = await service.forgotPassword('test@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(tokenService.createPasswordResetToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'If an account exists, a reset email has been sent' });
    });

    it('should return same message for non-existent email (security)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(tokenService.createPasswordResetToken).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'If an account exists, a reset email has been sent' });
    });

    it('should send password reset email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      tokenService.createPasswordResetToken.mockResolvedValue('reset-token-123');

      await service.forgotPassword('test@example.com');

      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        `${mockUser.firstName} ${mockUser.lastName}`,
        'reset-token-123',
      );
    });
  });

  // ========================================================================
  // RESET PASSWORD
  // ========================================================================
  describe('resetPassword()', () => {
    const resetDto = {
      token: 'valid-reset-token',
      newPassword: 'NewSecurePass456!',
    };

    it('should update password with valid token', async () => {
      tokenService.validatePasswordResetToken.mockResolvedValue(mockUser.id);
      usersService.update.mockResolvedValue({ ...mockUser, password: 'new-hashed' });
      tokenService.invalidateUserTokens.mockResolvedValue(undefined);

      const result = await service.resetPassword(resetDto);

      expect(tokenService.validatePasswordResetToken).toHaveBeenCalledWith(resetDto.token);
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          password: expect.any(String),
        }),
      );

      // Verify password is hashed
      const updateCall = (usersService.update as jest.Mock).mock.calls[0][1];
      expect(updateCall.password).not.toBe(resetDto.newPassword);
      expect(updateCall.password).toMatch(/^\$2[aby]\$/);

      expect(tokenService.invalidateUserTokens).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'Password has been reset successfully' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      tokenService.validatePasswordResetToken.mockRejectedValue(
        new BadRequestException('Invalid or expired reset token'),
      );

      await expect(service.resetPassword(resetDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for weak password', async () => {
      await expect(
        service.resetPassword({
          ...resetDto,
          newPassword: 'weak',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(tokenService.validatePasswordResetToken).not.toHaveBeenCalled();
    });

    it('should invalidate all existing tokens after password reset', async () => {
      tokenService.validatePasswordResetToken.mockResolvedValue(mockUser.id);
      usersService.update.mockResolvedValue(mockUser);

      await service.resetPassword(resetDto);

      expect(tokenService.invalidateUserTokens).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // ========================================================================
  // VERIFY EMAIL
  // ========================================================================
  describe('verifyEmail()', () => {
    it('should verify email with valid token', async () => {
      const verificationToken = 'valid-verification-token';
      tokenService.verifyRefreshToken.mockResolvedValue({
        userId: mockUser.id,
        type: 'email_verification',
      });
      usersService.update.mockResolvedValue({ ...mockUser, emailVerified: true });

      const result = await service.verifyEmail(verificationToken);

      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
        emailVerified: true,
        status: 'active',
      });
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      tokenService.verifyRefreshToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  // ========================================================================
  // GET CURRENT USER (ME)
  // ========================================================================
  describe('getCurrentUser()', () => {
    it('should return current user profile', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(mockUser.id);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
    });

    it('should not include password in user profile', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser(mockUser.id);

      expect(result).not.toHaveProperty('password');
    });
  });
});
