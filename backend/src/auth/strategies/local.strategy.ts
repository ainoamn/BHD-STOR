import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: false,
    });

    this.logger.log('Local Strategy initialized', 'LocalStrategy');
  }

  async validate(email: string, password: string): Promise<any> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.logger.warn(`Invalid email format: ${email}`, 'LocalStrategy');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Please provide a valid email address',
        error: 'Unauthorized',
        field: 'email',
      });
    }

    // Validate password is not empty
    if (!password || password.length < 6) {
      this.logger.warn('Password too short', 'LocalStrategy');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Password must be at least 6 characters',
        error: 'Unauthorized',
        field: 'password',
      });
    }

    // Validate credentials
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      this.logger.warn(`Invalid credentials for email: ${email}`, 'LocalStrategy');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      this.logger.warn(`Inactive user attempted login: ${email}`, 'LocalStrategy');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Account is deactivated. Please contact support.',
        error: 'Unauthorized',
      });
    }

    return user;
  }
}
