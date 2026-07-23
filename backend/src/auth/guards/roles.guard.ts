import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role, ROLES_KEY } from '@common/decorators/roles.decorator';
import { roleSatisfies } from '../utils/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn('Roles guard: No user found in request');
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Authentication required',
        error: 'Forbidden',
      });
    }

    const hasRole = requiredRoles.some((role) =>
      roleSatisfies(user.role, role),
    );

    if (!hasRole) {
      this.logger.warn(
        `User ${user.email} with role ${user.role} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`,
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

  /** @deprecated Prefer importing roleSatisfies from auth/utils/roles */
  roleSatisfies(userRole: string, required: string): boolean {
    return roleSatisfies(userRole, required);
  }
}
