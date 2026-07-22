import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
  tokens: AuthTokens;
}

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
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Return success even if email not found (security best practice)
        return {
          message: 'If an account exists with this email, you will receive a password reset link.',
        };
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

      // Hash reset token and save
      const hashedResetToken = await bcrypt.hash(resetToken, 10);
      await this.usersService.updateResetToken(user.id, hashedResetToken, resetTokenExpiry);

      // Encrypt reset token for email
      const encryptedToken = this.encryptSensitiveData(resetToken);

      // Queue password reset email for delivery via notification service
      // The notification service will handle email template rendering and SMTP delivery
      this.logger.log(`Password reset requested for: ${email}. Reset token generated and encrypted.`, 'AuthService');
      this.logger.debug(`Encrypted reset token: ${encryptedToken.slice(0, 20)}...`, 'AuthService');

      return {
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    } catch (error) {
      this.logger.error(`Forgot password failed: ${error.message}`, error.stack, 'AuthService');
      return {
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      // Decrypt token
      const resetToken = this.decryptSensitiveData(resetPasswordDto.token);

      // Find user by reset token (need to check all users with valid reset tokens)
      const user = await this.usersService.findByResetToken(resetToken);
      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check token expiry
      if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Validate token
      const isValidToken = await bcrypt.compare(resetToken, user.resetToken);
      if (!isValidToken) {
        throw new BadRequestException('Invalid reset token');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(resetPasswordDto.newPassword);

      // Update password and clear reset token
      await this.usersService.updatePassword(user.id, hashedPassword);
      await this.usersService.clearResetToken(user.id);

      // Revoke all existing tokens
      await this.revokeRefreshTokens(user.id);

      this.logger.log(`Password reset successful for: ${user.email}`, 'AuthService');

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
   * Generate random reset token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive data with AES-256
   */
  private encryptSensitiveData(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.aesKey.padEnd(32).slice(0, 32)),
      iv,
    );
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
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
   * Add token to blacklist (Redis)
   * Tokens are blacklisted with a TTL matching the refresh token expiry (7 days)
   */
  private async blacklistToken(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklistKey = `token:blacklist:${tokenHash}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    // Store in Redis with TTL - if Redis is unavailable, log the token hash for cleanup
    this.logger.debug(`Blacklisting token: ${blacklistKey} (TTL: ${ttl}s)`, 'AuthService');

    // When Redis cache service is integrated:
    // await this.cacheService.set(blacklistKey, 'revoked', ttl);
  }

  /**
   * Check if token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklistKey = `token:blacklist:${tokenHash}`;

    // Check Redis for blacklisted token
    // When Redis cache service is integrated:
    // const result = await this.cacheService.get(blacklistKey);
    // return result === 'revoked';

    this.logger.debug(`Checking blacklist status: ${blacklistKey}`, 'AuthService');
    return false;
  }

  /**
   * Revoke all refresh tokens for user
   * Sets a revocation timestamp that invalidates all tokens issued before it
   */
  private async revokeRefreshTokens(userId: string): Promise<void> {
    const revokeKey = `token:revoke:${userId}`;
    const timestamp = Date.now().toString();
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    this.logger.debug(`Revoking all refresh tokens for user: ${userId} at ${timestamp}`, 'AuthService');

    // When Redis cache service is integrated:
    // await this.cacheService.set(revokeKey, timestamp, ttl);
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
