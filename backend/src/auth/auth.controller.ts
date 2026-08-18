import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { EnableTwoFactorDto } from './dto/enable-two-factor.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { CompleteBhdOidcDto } from './dto/complete-bhd-oidc.dto';
import { BhdIdentityService } from './services/bhd-identity.service';
import { clearAuthCookies, setAuthCookies } from './utils/auth-cookies';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly bhdIdentityService: BhdIdentityService,
  ) {}

  /**
   * Register new user
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new customer or seller account on the BHD Oman marketplace.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    if (result?.tokens) {
      setAuthCookies(res, result.tokens, this.configService);
    }
    return result;
  }

  /**
   * Login user
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate with email and password. Sets HttpOnly auth cookies and returns tokens for API clients.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(
    @Body() _loginDto: LoginDto,
    @CurrentUser() _user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(_loginDto);
    if (result?.requiresTwoFactor) {
      return result;
    }
    if (result?.tokens) {
      setAuthCookies(res, result.tokens, this.configService);
    }
    return result;
  }

  /**
   * Finish BHD Identity OIDC after the Next.js PKCE callback.
   * Issues store JWTs/cookies. Does not copy the identity `bhd_id` cookie.
   */
  @Public()
  @Post('bhd/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete BHD Identity login',
    description:
      'Exchange an authorization code for BHD Identity tokens, upsert the local customer by bhd_sub, and set store session cookies.',
  })
  @ApiBody({ type: CompleteBhdOidcDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Store session issued' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Identity verification failed' })
  async completeBhdOidc(
    @Body() dto: CompleteBhdOidcDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.bhdIdentityService.completeLogin(dto);
    if (result?.tokens) {
      setAuthCookies(res, result.tokens, this.configService);
    }
    return result;
  }

  /**
   * Begin TOTP enrollment
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Setup two-factor authentication',
    description: 'Generate a TOTP secret and otpauth URL for authenticator apps.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Setup payload returned' })
  async setupTwoFactor(@CurrentUser('userId') userId: string) {
    return this.authService.setupTwoFactor(userId);
  }

  /**
   * Confirm TOTP enrollment
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Enable two-factor authentication',
    description: 'Verify a TOTP code against the pending secret and enable 2FA. Returns backup codes once.',
  })
  @ApiBody({ type: EnableTwoFactorDto })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA enabled; backup codes returned' })
  async enableTwoFactor(
    @CurrentUser('userId') userId: string,
    @Body() dto: EnableTwoFactorDto,
  ) {
    return this.authService.enableTwoFactor(userId, dto.code);
  }

  /**
   * Disable TOTP
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Disable two-factor authentication',
    description: 'Disable 2FA after verifying a TOTP or backup code.',
  })
  @ApiBody({ type: DisableTwoFactorDto })
  @ApiResponse({ status: HttpStatus.OK, description: '2FA disabled' })
  async disableTwoFactor(
    @CurrentUser('userId') userId: string,
    @Body() dto: DisableTwoFactorDto,
  ) {
    return this.authService.disableTwoFactor(userId, dto.code);
  }

  /**
   * Complete login after 2FA challenge
   */
  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify two-factor login',
    description: 'Complete login using the challenge token from login and a TOTP/backup code.',
  })
  @ApiBody({ type: VerifyTwoFactorDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login completed' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid challenge or code' })
  async verifyTwoFactor(
    @Body() dto: VerifyTwoFactorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyTwoFactorLogin(
      dto.challengeToken,
      dto.code,
    );
    if (result?.tokens) {
      setAuthCookies(res, result.tokens, this.configService);
    }
    return result;
  }

  /**
   * Logout user
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidate current JWT tokens and clear auth cookies.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  async logout(
    @CurrentUser('userId') userId: string,
    @Body('token') token?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.authService.logout(userId, token);
    if (res) {
      clearAuthCookies(res, this.configService);
    }
    return result;
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh tokens',
    description: 'Get a new access token using refresh token from body or HttpOnly cookie.',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      refreshTokenDto?.refreshToken ||
      (req.cookies?.refreshToken as string | undefined);
    const result = await this.authService.refreshTokens({ refreshToken: refreshToken || '' });
    if (result?.accessToken && result?.refreshToken) {
      setAuthCookies(res, result, this.configService);
    }
    return result;
  }

  /**
   * Forgot password
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Request a password reset link to be sent to your email.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if account exists)',
    schema: {
      example: {
        data: {
          message: 'If an account exists with this email, you will receive a password reset link.',
        },
        meta: {
          timestamp: '2024-01-15T10:30:00.000Z',
          requestId: 'req-12345',
        },
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Reset password
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using the token received via email.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
    schema: {
      example: {
        data: {
          message: 'Password has been reset successfully. Please login with your new password.',
        },
        meta: {
          timestamp: '2024-01-15T10:30:00.000Z',
          requestId: 'req-12345',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * Get current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the profile of the currently authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+96812345678',
          role: 'customer',
          avatar: 'https://cdn.example.com/avatars/user.jpg',
          isEmailVerified: true,
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
        meta: {
          timestamp: '2024-01-15T10:30:00.000Z',
          requestId: 'req-12345',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }

  /**
   * Update current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update profile',
    description: 'Update the profile of the currently authenticated user.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '+96812345678' },
        avatar: { type: 'string', example: 'https://cdn.example.com/avatars/user.jpg' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
  })
  async updateMe(
    @CurrentUser('userId') userId: string,
    @Body() updateData: { firstName?: string; lastName?: string; phone?: string; avatar?: string },
  ) {
    return this.authService.updateMe(userId, updateData);
  }
}
