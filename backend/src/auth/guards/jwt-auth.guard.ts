import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Add custom JWT auth logic
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Access token is required',
        error: 'Unauthorized',
      });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
        error: 'Unauthorized',
      });
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Handle specific JWT errors
    if (info?.name === 'TokenExpiredError') {
      this.logger.warn('JWT token has expired', 'JwtAuthGuard');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Access token has expired. Please refresh your token.',
        error: 'TokenExpired',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (info?.name === 'JsonWebTokenError') {
      this.logger.warn('Invalid JWT token', 'JwtAuthGuard');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid access token',
        error: 'TokenInvalid',
        code: 'TOKEN_INVALID',
      });
    }

    if (info?.name === 'NotBeforeError') {
      this.logger.warn('JWT token not active', 'JwtAuthGuard');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Token is not active yet',
        error: 'TokenNotActive',
        code: 'TOKEN_NOT_ACTIVE',
      });
    }

    if (err || !user) {
      this.logger.warn(
        `Authentication failed: ${err?.message || 'User not found'}`,
        'JwtAuthGuard',
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: err?.message || 'Authentication failed',
        error: 'Unauthorized',
      });
    }

    return user;
  }
}
