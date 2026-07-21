import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET', '');
    const jwtIssuer = configService.get<string>('JWT_ISSUER', 'bhd-oman-marketplace');
    const jwtAudience = configService.get<string>('JWT_AUDIENCE', 'bhd-oman-api');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      issuer: jwtIssuer,
      audience: jwtAudience,
      algorithms: ['HS256'],
      passReqToCallback: false,
    });

    this.logger.log('JWT Strategy initialized', 'JwtStrategy');
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Verify this is an access token
    if (payload.type !== 'access') {
      this.logger.warn(`Invalid token type: ${payload.type}`, 'JwtStrategy');
      throw new UnauthorizedException('Invalid token type');
    }

    // Check if user still exists and is active
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      this.logger.warn(`User not found: ${payload.sub}`, 'JwtStrategy');
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      this.logger.warn(`User account deactivated: ${payload.sub}`, 'JwtStrategy');
      throw new UnauthorizedException('User account has been deactivated');
    }

    // Get user permissions based on role
    const permissions = this.getRolePermissions(user.role);

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions,
    };
  }

  /**
   * Get permissions for a given role
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'users:*',
        'stores:*',
        'products:*',
        'orders:*',
        'payments:*',
        'shipping:*',
        'subscriptions:*',
        'analytics:*',
        'settings:*',
      ],
      seller: [
        'stores:manage',
        'products:manage',
        'orders:read',
        'orders:update',
        'shipping:manage',
        'analytics:read',
      ],
      customer: [
        'products:read',
        'orders:create',
        'orders:read',
        'profile:manage',
        'reviews:create',
      ],
      moderator: [
        'stores:read',
        'products:read',
        'products:moderate',
        'orders:read',
        'users:read',
      ],
    };

    return rolePermissions[role] || rolePermissions['customer'];
  }
}
