import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { assertStoreAnalyticsAccess } from './store-analytics-access';

describe('assertStoreAnalyticsAccess', () => {
  const store = { id: 's1', ownerId: 'owner-1' };

  it('allows owner and staff', () => {
    expect(() =>
      assertStoreAnalyticsAccess(store, 'owner-1', 'customer'),
    ).not.toThrow();
    expect(() =>
      assertStoreAnalyticsAccess(store, 'other', 'admin'),
    ).not.toThrow();
  });

  it('rejects missing store and non-owners', () => {
    expect(() => assertStoreAnalyticsAccess(null, 'u1', 'customer')).toThrow(
      NotFoundException,
    );
    expect(() =>
      assertStoreAnalyticsAccess(store, 'other', 'customer'),
    ).toThrow(ForbiddenException);
  });
});
