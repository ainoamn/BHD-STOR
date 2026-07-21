import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'refresh';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(RefreshTokenStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const jwtRefreshSecret = configService.get<string>('JWT_REFRESH_SECRET', '');
    const jwtIssuer = configService.get<string>('JWT_ISSUER', 'bhd-oman-marketplace');
    const jwtAudience = configService.get<string>('JWT_AUDIENCE', 'bhd-oman-api');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Extract from request body
        (req: Request) => {
          return req?.body?.refreshToken;
        },
        // Extract from cookie
        (req: Request) => {
          return req?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtRefreshSecret,
      issuer: jwtIssuer,
      audience: jwtAudience,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });

    this.logger.log('Refresh Token Strategy initialized', 'RefreshTokenStrategy');
  }

  async validate(req: Request, payload: RefreshTokenPayload): Promise<any> {
    // Verify this is a refresh token
    if (payload.type !== 'refresh') {
      this.logger.warn(`Invalid token type for refresh: ${payload.type}`, 'RefreshTokenStrategy');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid token type. Refresh token required.',
        error: 'Unauthorized',
      });
    }

    // Extract refresh token from request for potential blacklisting
    const refreshToken =
      req.body?.refreshToken ||
      req.cookies?.refreshToken ||
      req.headers.authorization?.split(' ')[1];

    if (!refreshToken) {
      this.logger.warn('No refresh token found in request', 'RefreshTokenStrategy');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token is required',
        error: 'Unauthorized',
      });
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
