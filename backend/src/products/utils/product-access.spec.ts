import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  assertProductManageAccess,
  assertStoreProductAccess,
} from './product-access';

const OWNER = '550e8400-e29b-41d4-a716-446655440000';
const OTHER = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('product-access', () => {
  describe('assertStoreProductAccess', () => {
    it('allows store owner and staff', () => {
      expect(() =>
        assertStoreProductAccess({ id: 's1', ownerId: OWNER }, OWNER, 'seller'),
      ).not.toThrow();
      expect(() =>
        assertStoreProductAccess({ id: 's1', ownerId: OWNER }, OTHER, 'admin'),
      ).not.toThrow();
    });

    it('rejects non-owners', () => {
      expect(() =>
        assertStoreProductAccess({ id: 's1', ownerId: OWNER }, OTHER, 'seller'),
      ).toThrow(ForbiddenException);
    });

    it('throws when store missing', () => {
      expect(() =>
        assertStoreProductAccess(null, OWNER, 'seller'),
      ).toThrow(NotFoundException);
    });
  });

  describe('assertProductManageAccess', () => {
    it('checks nested store ownership', () => {
      expect(() =>
        assertProductManageAccess(
          { id: 'p1', store: { id: 's1', ownerId: OWNER } },
          OWNER,
          'seller',
        ),
      ).not.toThrow();
      expect(() =>
        assertProductManageAccess(
          { id: 'p1', store: { id: 's1', ownerId: OWNER } },
          OTHER,
          'customer',
        ),
      ).toThrow(ForbiddenException);
    });
  });
});
