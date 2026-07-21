import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException({
        success: false,
        message: 'Access denied. Admin privileges required.',
        code: 'ADMIN_ACCESS_REQUIRED',
        requiredRoles: allowedRoles,
        currentRole: user.role,
      });
    }

    return true;
  }
}
