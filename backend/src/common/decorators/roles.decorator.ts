import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@users/entities/user.entity';

export type Role = UserRole | string;

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route handler or controller.
 * Supports multiple roles with OR logic - user needs at least one of the specified roles.
 *
 * @example
 * // Single role
 * @Roles(UserRole.ADMIN)
 *
 * @example
 * // Multiple roles (OR logic)
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
