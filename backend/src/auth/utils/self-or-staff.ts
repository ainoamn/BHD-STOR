import { ForbiddenException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

/** Self-or-staff gate used by commission/gamification user-scoped reads. */
export function assertSelfOrStaff(
  requesterId: string,
  targetUserId: string,
  role?: string,
  message = 'You can only view your own data',
): void {
  if (isStaffRole(role)) return;
  if (requesterId && requesterId === targetUserId) return;
  throw new ForbiddenException(message);
}
