import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role } from '@common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check if user exists
    if (!user) {
      this.logger.warn('Roles guard: No user found in request', 'RolesGuard');
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Authentication required',
        error: 'Forbidden',
      });
    }

    // Check if user has any of the required roles (OR logic)
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `User ${user.email} with role ${user.role} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`,
        'RolesGuard',
      );
      throw new ForbiddenException({
        statusCode: 403,
        message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    return true;
  }
}
