import { ForbiddenException } from '@nestjs/common';
import { assertReturnAccess } from './return-access';

describe('assertReturnAccess', () => {
  const sample = { userId: 'owner-1' };

  it('allows owner and staff', () => {
    expect(() => assertReturnAccess(sample, 'owner-1', 'customer')).not.toThrow();
    expect(() => assertReturnAccess(sample, 'other', 'admin')).not.toThrow();
    expect(() => assertReturnAccess(sample, 'other', 'super_admin')).not.toThrow();
    expect(() => assertReturnAccess(sample, 'other', 'moderator')).not.toThrow();
  });

  it('rejects other customers', () => {
    expect(() => assertReturnAccess(sample, 'other', 'customer')).toThrow(
      ForbiddenException,
    );
  });
});
