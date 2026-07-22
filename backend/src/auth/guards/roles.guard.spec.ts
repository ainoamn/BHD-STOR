import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function mockContext(user: any, requiredRoles: string[] | undefined) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const ctx = {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
  return { guard, ctx };
}

describe('RolesGuard', () => {
  it('allows when no roles required', () => {
    const { guard, ctx } = mockContext({ role: 'customer' }, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows exact role match', () => {
    const { guard, ctx } = mockContext(
      { role: 'admin', email: 'a@b.c' },
      ['admin'],
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('super_admin satisfies admin', () => {
    const { guard, ctx } = mockContext(
      { role: 'super_admin', email: 's@b.c' },
      ['admin'],
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects customer for admin route', () => {
    const { guard, ctx } = mockContext(
      { role: 'customer', email: 'c@b.c' },
      ['admin'],
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('roleSatisfies helper', () => {
    const { guard } = mockContext(null, []);
    expect(guard.roleSatisfies('super_admin', 'admin')).toBe(true);
    expect(guard.roleSatisfies('admin', 'admin')).toBe(true);
    expect(guard.roleSatisfies('customer', 'admin')).toBe(false);
  });
});
