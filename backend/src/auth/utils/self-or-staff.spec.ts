import { ForbiddenException } from '@nestjs/common';
import { assertSelfOrStaff } from './self-or-staff';

describe('assertSelfOrStaff', () => {
  it('allows self and staff', () => {
    expect(() => assertSelfOrStaff('u1', 'u1', 'customer')).not.toThrow();
    expect(() => assertSelfOrStaff('admin', 'u1', 'admin')).not.toThrow();
    expect(() => assertSelfOrStaff('x', 'u1', 'super_admin')).not.toThrow();
  });

  it('rejects other customers', () => {
    expect(() => assertSelfOrStaff('u2', 'u1', 'customer')).toThrow(
      ForbiddenException,
    );
  });
});
