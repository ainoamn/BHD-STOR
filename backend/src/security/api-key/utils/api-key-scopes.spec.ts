import { ForbiddenException } from '@nestjs/common';
import { ApiKeyScope } from '../entities/api-key.entity';
import {
  assertApiKeyScopesAllowed,
  scopesAllowedForRole,
  STAFF_ONLY_API_KEY_SCOPES,
  USER_SAFE_API_KEY_SCOPES,
} from './api-key-scopes';

describe('api-key-scopes', () => {
  it('allows safe scopes for sellers', () => {
    expect(() =>
      assertApiKeyScopesAllowed(
        [ApiKeyScope.PRODUCTS_READ, ApiKeyScope.ORDERS_WRITE],
        'seller',
      ),
    ).not.toThrow();
  });

  it('rejects privileged scopes for non-staff', () => {
    for (const scope of STAFF_ONLY_API_KEY_SCOPES) {
      expect(() =>
        assertApiKeyScopesAllowed([scope], 'seller'),
      ).toThrow(ForbiddenException);
    }
  });

  it('allows all scopes for admin', () => {
    expect(() =>
      assertApiKeyScopesAllowed(
        [ApiKeyScope.ADMIN, ApiKeyScope.FULL_ACCESS],
        'admin',
      ),
    ).not.toThrow();
  });

  it('lists role-filtered scopes', () => {
    expect(scopesAllowedForRole('seller')).toEqual(
      expect.arrayContaining([...USER_SAFE_API_KEY_SCOPES]),
    );
    expect(scopesAllowedForRole('seller')).not.toContain(ApiKeyScope.ADMIN);
    expect(scopesAllowedForRole('admin')).toContain(ApiKeyScope.ADMIN);
  });
});
