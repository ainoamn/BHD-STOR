import { UnauthorizedException } from '@nestjs/common';
import { getRequestUserId, requireRequestUserId } from './request-user';

describe('request-user helpers', () => {
  it('prefers userId then id then sub', () => {
    expect(getRequestUserId({ userId: 'a', id: 'b', sub: 'c' })).toBe('a');
    expect(getRequestUserId({ id: 'b', sub: 'c' })).toBe('b');
    expect(getRequestUserId({ sub: 'c' })).toBe('c');
    expect(getRequestUserId(null)).toBeNull();
  });

  it('requireRequestUserId throws when missing', () => {
    expect(() => requireRequestUserId({})).toThrow(UnauthorizedException);
    expect(requireRequestUserId({ userId: 'u1' })).toBe('u1');
  });
});
