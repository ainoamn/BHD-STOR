import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TotpService } from './services/totp.service';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
  tokens?: AuthTokens;
  requiresTwoFactor?: boolean;
  challengeToken?: string;
}

/** Process-local fallback when Redis is down (single-instance only). */
const memoryBlacklist = new Map<string, number>(); // key -> expiresAtMs
const memoryUserRevokes = new Map<string, number>(); // userId -> revokedAtMs

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;
  private readonly jwtIssuer: string;
  private readonly jwtAudience: string;
  private readonly aesKey: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly totpService: TotpService,
    @Optional() @InjectRedis() private readonly redis?: Redis,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', '');
    this.jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', '');
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    this.jwtRefreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    this.jwtIssuer = this.configService.get<string>('JWT_ISSUER', 'bhd-oman-marketplace');
    this.jwtAudience = this.configService.get<string>('JWT_AUDIENCE', 'bhd-oman-api');
    this.aesKey = this.configService.get<string>('AES_ENCRYPTION_KEY', '');
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email address is already registered');
      }

      // Hash password with bcrypt (12 rounds)
      const hashedPassword = await this.hashPassword(registerDto.password);

      // Create user
      const user = await this.usersService.create({
        ...registerDto,
        password: hashedPassword,
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      this.logger.log(`New user registered: ${user.email}`, 'AuthService');

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Registration failed: ${error.message}`, error.stack, 'AuthService');
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Login user with credentials
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      // Validate user credentials
      const user = await this.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated. Please contact support.');
      }

      // Check if email is verified (can be relaxed in development)
      const requireVerified =
        this.configService.get<string>('AUTH_REQUIRE_EMAIL_VERIFICATION', 'false') === 'true' ||
        this.configService.get<string>('NODE_ENV') === 'production';
      if (requireVerified && !user.isEmailVerified) {
        throw new UnauthorizedException('Please verify your email address before logging in.');
      }

      // Update last login
      await this.usersService.updateLastLogin(user.id);

      // Challenge with 2FA instead of issuing tokens
      if (user.twoFactorEnabled) {
        const challengeToken = await this.jwtService.signAsync(
          {
            sub: user.id,
            purpose: '2fa-challenge',
          },
          {
            secret: this.jwtSecret,
            expiresIn: '5m',
            issuer: this.jwtIssuer,
            audience: this.jwtAudience,
          },
        );

        this.logger.log(`2FA challenge issued for: ${user.email}`, 'AuthService');

        return {
          requiresTwoFactor: true,
          challengeToken,
        };
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      this.logger.log(`User logged in: ${user.email}`, 'AuthService');

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed: ${error.message}`, error.stack, 'AuthService');
      throw new InternalServerErrorException('Failed to login');
    }
  }

  /**
   * Complete login after 2FA challenge.
   */
  async verifyTwoFactorLogin(
    challengeToken: string,
    code: string,
  ): Promise<AuthResponse> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        purpose?: string;
      }>(challengeToken, {
        secret: this.jwtSecret,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      });

      if (payload.purpose !== '2fa-challenge' || !payload.sub) {
        throw new UnauthorizedException('Invalid two-factor challenge');
      }

      const valid = await this.totpService.verifyLoginCode(payload.sub, code);
      if (!valid) {
        throw new UnauthorizedException('Invalid verification code');
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      await this.usersService.updateLastLogin(user.id);
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      this.logger.log(`User completed 2FA login: ${user.email}`, 'AuthService');

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        tokens,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Two-factor challenge has expired. Please login again.',
        );
      }
      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid two-factor challenge');
      }
      this.logger.error(
        `2FA login verify failed: ${error.message}`,
        error.stack,
        'AuthService',
      );
      throw new UnauthorizedException('Failed to verify two-factor code');
    }
  }

  setupTwoFactor(userId: string) {
    return this.totpService.setup(userId);
  }

  enableTwoFactor(userId: string, code: string) {
    return this.totpService.enable(userId, code);
  }

  disableTwoFactor(userId: string, code: string) {
    return this.totpService.disable(userId, code);
  }

  /**
   * Logout user - invalidate tokens
   */
  async logout(userId: string, token?: string): Promise<{ message: string }> {
    try {
      // Add token to blacklist (if using token blacklist approach)
      if (token) {
        await this.blacklistToken(token);
      }

      // Clear refresh tokens for user
      await this.revokeRefreshTokens(userId);

      this.logger.log(`User logged out: ${userId}`, 'AuthService');

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack, 'AuthService');
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.jwtRefreshSecret,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      });

      // Check token type
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshTokenDto.refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      if (await this.areUserTokensRevoked(payload.sub, payload.iat)) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Get user
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Blacklist old refresh token
      await this.blacklistToken(refreshTokenDto.refreshToken);

      this.logger.log(`Tokens refreshed for user: ${user.email}`, 'AuthService');

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired. Please login again.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack, 'AuthService');
      throw new UnauthorizedException('Failed to refresh tokens');
    }
  }

  /**
   * Request password reset.
   * Stores `selector:sha256(verifier)` in reset_token; emails/returns `selector.verifier`.
   */
  async forgotPassword(
    email: string,
  ): Promise<{ message: string; resetToken?: string }> {
    const genericMessage =
      'If an account exists with this email, you will receive a password reset link.';

    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return { message: genericMessage };
      }

      const { selector, verifier, rawToken } = this.generateResetTokenPair();
      const verifierHash = this.hashVerifier(verifier);
      const storedToken = `${selector}:${verifierHash}`;

      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      await this.usersService.updateResetToken(user.id, storedToken, resetTokenExpiry);

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        this.configService.get<string>('PUBLIC_APP_URL') ||
        this.configService.get<string>('APP_URL') ||
        'http://localhost:3000';
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

      // No MailService in this codebase — structured log without the full token.
      this.logger.log(
        JSON.stringify({
          event: 'password_reset_requested',
          userId: user.id,
          email: user.email,
          selector,
          expiresAt: resetTokenExpiry.toISOString(),
          resetPath: '/reset-password',
        }),
        'AuthService',
      );
      this.logger.debug(
        `Password reset link prepared for ${user.email} (selector=${selector}, urlHost=${new URL(resetUrl).host})`,
        'AuthService',
      );

      const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
      if (isDev) {
        return { message: genericMessage, resetToken: rawToken };
      }

      return { message: genericMessage };
    } catch (error) {
      this.logger.error(`Forgot password failed: ${error.message}`, error.stack, 'AuthService');
      return { message: genericMessage };
    }
  }

  /**
   * Reset password with selector.verifier token from email / forgotPassword.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const rawToken = this.normalizeResetToken(resetPasswordDto.token);
      const parsed = this.parseResetToken(rawToken);
      if (!parsed) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const { selector, verifier } = parsed;
      const user = await this.usersService.findByResetTokenSelector(selector);
      if (!user || !user.resetToken) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
        await this.usersService.clearResetToken(user.id);
        throw new BadRequestException('Reset token has expired');
      }

      const storedParts = user.resetToken.split(':');
      if (storedParts.length !== 2 || storedParts[0] !== selector) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const expectedHash = storedParts[1];
      const actualHash = this.hashVerifier(verifier);
      if (!this.equalHexHashes(expectedHash, actualHash)) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await this.hashPassword(resetPasswordDto.newPassword);

      await this.usersService.updatePassword(user.id, hashedPassword);
      await this.usersService.clearResetToken(user.id);

      await this.revokeRefreshTokens(user.id);

      this.logger.log(
        JSON.stringify({
          event: 'password_reset_completed',
          userId: user.id,
          email: user.email,
        }),
        'AuthService',
      );

      return { message: 'Password has been reset successfully. Please login with your new password.' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Password reset failed: ${error.message}`, error.stack, 'AuthService');
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string) {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Get profile failed: ${error.message}`, error.stack, 'AuthService');
      throw new InternalServerErrorException('Failed to get user profile');
    }
  }

  /**
   * Update current user profile
   */
  async updateMe(userId: string, updateData: Partial<{ firstName: string; lastName: string; phone: string; avatar: string }>) {
    try {
      const user = await this.usersService.update(userId, updateData);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Update profile failed: ${error.message}`, error.stack, 'AuthService');
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`User validation failed: ${error.message}`, error.stack, 'AuthService');
      return null;
    }
  }

  /**
   * Reject access/refresh tokens that were blacklisted or issued before a user-wide revoke.
   */
  async isSessionTokenRevoked(
    token: string | undefined,
    payload: { sub: string; iat?: number },
  ): Promise<boolean> {
    if (token && (await this.isTokenBlacklisted(token))) {
      return true;
    }
    return this.areUserTokensRevoked(payload.sub, payload.iat);
  }

  /**
   * Hash password with bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret,
        expiresIn: this.jwtExpiresIn,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.jwtRefreshSecret,
        expiresIn: this.jwtRefreshExpiresIn,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience,
      }),
    ]);

    // Parse expiresIn to seconds
    const expiresInSeconds = this.parseExpiresIn(this.jwtExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  /**
   * Generate selector (public lookup key) + verifier (secret).
   */
  private generateResetTokenPair(): {
    selector: string;
    verifier: string;
    rawToken: string;
  } {
    const selector = crypto.randomBytes(8).toString('hex'); // 16 hex
    const verifier = crypto.randomBytes(32).toString('hex'); // 64 hex
    return {
      selector,
      verifier,
      rawToken: `${selector}.${verifier}`,
    };
  }

  private hashVerifier(verifier: string): string {
    return crypto.createHash('sha256').update(verifier, 'utf8').digest('hex');
  }

  /** Accept raw selector.verifier, or legacy AES-encrypted blobs. */
  private normalizeResetToken(token: string): string {
    const trimmed = token?.trim();
    if (!trimmed) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (trimmed.includes('.') && /^[a-f0-9]{16}\.[a-f0-9]+$/i.test(trimmed)) {
      return trimmed;
    }
    // Legacy path: token may still be AES-encrypted from older clients
    if (trimmed.includes(':') && this.aesKey) {
      try {
        return this.decryptSensitiveData(trimmed);
      } catch {
        // fall through — treat as invalid below
      }
    }
    return trimmed;
  }

  private parseResetToken(
    rawToken: string,
  ): { selector: string; verifier: string } | null {
    const parts = rawToken.split('.');
    if (parts.length !== 2) {
      return null;
    }
    const [selector, verifier] = parts;
    if (!/^[a-f0-9]{16}$/i.test(selector) || !/^[a-f0-9]{64}$/i.test(verifier)) {
      return null;
    }
    return { selector: selector.toLowerCase(), verifier: verifier.toLowerCase() };
  }

  private equalHexHashes(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'hex');
      const bufB = Buffer.from(b, 'hex');
      if (bufA.length === 0 || bufA.length !== bufB.length) {
        return false;
      }
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Decrypt sensitive data (legacy reset tokens only)
   */
  private decryptSensitiveData(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid token format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.aesKey.padEnd(32).slice(0, 32)),
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Add token to blacklist (Redis, with in-memory fallback).
   * TTL matches remaining JWT lifetime when available.
   */
  async blacklistToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklistKey = `auth:blacklist:${tokenHash}`;
    const ttl = this.getTokenRemainingTtlSeconds(token);

    const stored = await this.kvSet(blacklistKey, '1', ttl);
    if (!stored) {
      // In-memory fallback for single-instance / test environments without Redis
      memoryBlacklist.set(blacklistKey, Date.now() + ttl * 1000);
      this.logger.debug(
        `Blacklisted token in memory: ${blacklistKey} (TTL: ${ttl}s)`,
        'AuthService',
      );
      return;
    }
    this.logger.debug(`Blacklisted token: ${blacklistKey} (TTL: ${ttl}s)`, 'AuthService');
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklistKey = `auth:blacklist:${tokenHash}`;

    const fromRedis = await this.kvGet(blacklistKey);
    if (fromRedis !== null) {
      return fromRedis === '1' || fromRedis === 'revoked';
    }

    const expiresAt = memoryBlacklist.get(blacklistKey);
    if (expiresAt === undefined) {
      return false;
    }
    if (expiresAt <= Date.now()) {
      memoryBlacklist.delete(blacklistKey);
      return false;
    }
    return true;
  }

  /**
   * Revoke all tokens for user issued at or before now (iat check in validators).
   */
  async revokeRefreshTokens(userId: string): Promise<void> {
    const revokeKey = `auth:revoke:user:${userId}`;
    const timestampMs = Date.now();
    const ttl = this.parseExpiresIn(this.jwtRefreshExpiresIn);

    const stored = await this.kvSet(revokeKey, String(timestampMs), ttl);
    if (!stored) {
      memoryUserRevokes.set(userId, timestampMs);
      this.logger.debug(
        `Revoked user tokens in memory: ${userId} at ${timestampMs}`,
        'AuthService',
      );
      return;
    }
    this.logger.debug(`Revoking all tokens for user: ${userId} at ${timestampMs}`, 'AuthService');
  }

  /**
   * True if JWT iat (seconds) is before the user-wide revoke timestamp.
   */
  async areUserTokensRevoked(userId: string, iat?: number): Promise<boolean> {
    if (iat == null) {
      return false;
    }

    const revokeKey = `auth:revoke:user:${userId}`;
    let revokedAtMs: number | undefined;

    const fromRedis = await this.kvGet(revokeKey);
    if (fromRedis !== null) {
      revokedAtMs = Number(fromRedis);
    } else {
      revokedAtMs = memoryUserRevokes.get(userId);
    }

    if (revokedAtMs == null || Number.isNaN(revokedAtMs)) {
      return false;
    }

    // JWT iat is in seconds
    return iat < Math.floor(revokedAtMs / 1000);
  }

  private async kvSet(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis) {
      return false;
    }
    try {
      await this.redis.set(key, value, 'EX', Math.max(1, ttlSeconds));
      return true;
    } catch (err) {
      this.logger.warn(
        `Redis SET failed for ${key}; using memory fallback: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  private async kvGet(key: string): Promise<string | null> {
    if (!this.redis) {
      return null;
    }
    try {
      return await this.redis.get(key);
    } catch (err) {
      this.logger.warn(
        `Redis GET failed for ${key}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private getTokenRemainingTtlSeconds(token: string): number {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        return Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
      }
    } catch {
      // ignore
    }
    return this.parseExpiresIn(this.jwtRefreshExpiresIn);
  }

  /**
   * Parse expiresIn string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd]?)$/);
    if (!match) {
      return 900; // Default 15 minutes
    }
    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] || 1);
  }
}
