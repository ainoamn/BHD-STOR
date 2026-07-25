import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { isStaffRole } from '../../auth/utils/roles';

export interface StoreOwnerLike {
  id?: string;
  ownerId?: string | null;
}

/**
 * Staff may manage any store's products; otherwise requester must own the store.
 */
export function assertStoreProductAccess(
  store: StoreOwnerLike | null | undefined,
  requesterId: string,
  role?: string,
  message = 'You do not have permission to manage products for this store',
): void {
  if (!store) {
    throw new NotFoundException('Store not found');
  }
  if (isStaffRole(role)) return;
  if (store.ownerId && store.ownerId === requesterId) return;
  throw new ForbiddenException(message);
}

/**
 * Product must exist with a store; then same ownership rule as store.
 */
export function assertProductManageAccess(
  product: { id?: string; store?: StoreOwnerLike | null } | null | undefined,
  requesterId: string,
  role?: string,
  message = 'You do not have permission to manage this product',
): void {
  if (!product) {
    throw new NotFoundException('Product not found');
  }
  assertStoreProductAccess(product.store, requesterId, role, message);
}
