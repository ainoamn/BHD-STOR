import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err) {
      this.logger.warn(`Local auth error: ${err.message}`, 'LocalAuthGuard');
      throw new UnauthorizedException({
        statusCode: 401,
        message: err.message || 'Invalid credentials',
        error: 'Unauthorized',
      });
    }

    if (!user) {
      this.logger.warn('Local auth failed: User not found', 'LocalAuthGuard');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      });
    }

    return user;
  }
}
