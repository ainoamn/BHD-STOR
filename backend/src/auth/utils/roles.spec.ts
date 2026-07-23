import {
  isAdminRole,
  isStaffRole,
  normalizeRole,
  roleSatisfies,
} from './roles';

describe('role helpers', () => {
  it('normalizeRole lowercases', () => {
    expect(normalizeRole('Admin')).toBe('admin');
    expect(normalizeRole(null)).toBe('');
  });

  it('isStaffRole includes moderator', () => {
    expect(isStaffRole('moderator')).toBe(true);
    expect(isStaffRole('super_admin')).toBe(true);
    expect(isStaffRole('seller')).toBe(false);
  });

  it('isAdminRole excludes moderator', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('moderator')).toBe(false);
  });

  it('roleSatisfies hierarchy', () => {
    expect(roleSatisfies('super_admin', 'admin')).toBe(true);
    expect(roleSatisfies('super_admin', 'moderator')).toBe(true);
    expect(roleSatisfies('admin', 'moderator')).toBe(true);
    expect(roleSatisfies('moderator', 'admin')).toBe(false);
    expect(roleSatisfies('customer', 'admin')).toBe(false);
  });
});
