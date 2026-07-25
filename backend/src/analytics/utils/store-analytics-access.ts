import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

export interface StoreOwnerSubject {
  id: string;
  ownerId?: string | null;
}

/**
 * Staff may view any store analytics; otherwise requester must own the store.
 */
export function assertStoreAnalyticsAccess(
  store: StoreOwnerSubject | null | undefined,
  requesterId: string,
  role?: string,
): void {
  if (!store) {
    throw new NotFoundException('Store not found');
  }
  if (isStaffRole(role)) return;
  if (store.ownerId && store.ownerId === requesterId) return;
  throw new ForbiddenException('You do not have access to this store analytics');
}
