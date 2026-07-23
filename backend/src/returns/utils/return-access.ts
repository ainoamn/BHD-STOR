import { ForbiddenException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

export interface ReturnAccessSubject {
  userId: string;
}

/** Owner or platform staff may view/update a return request. */
export function assertReturnAccess(
  returnRequest: ReturnAccessSubject,
  userId: string,
  role?: string,
): void {
  if (isStaffRole(role)) return;
  if (returnRequest.userId && returnRequest.userId === userId) return;
  throw new ForbiddenException('You do not have access to this return request');
}
