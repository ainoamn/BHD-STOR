/**
 * Canonical marketplace role helpers.
 * Prefer these over ad-hoc string compares so super_admin / moderator stay consistent.
 */

export const STAFF_ROLES = ['admin', 'super_admin', 'moderator'] as const;
export const ADMIN_ROLES = ['admin', 'super_admin'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function normalizeRole(role: unknown): string {
  return String(role ?? '')
    .toLowerCase()
    .trim();
}

/** Platform staff: admin, super_admin, or moderator. */
export function isStaffRole(role: unknown): boolean {
  return (STAFF_ROLES as readonly string[]).includes(normalizeRole(role));
}

/** Full admin console: admin or super_admin (not moderator). */
export function isAdminRole(role: unknown): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(normalizeRole(role));
}

/**
 * Hierarchy used by RolesGuard / @Roles():
 * - exact match
 * - super_admin satisfies admin and moderator
 * - admin satisfies moderator
 */
export function roleSatisfies(userRole: unknown, required: unknown): boolean {
  const user = normalizeRole(userRole);
  const need = normalizeRole(required);
  if (!user || !need) return false;
  if (user === need) return true;
  if (user === 'super_admin') {
    return need === 'admin' || need === 'moderator';
  }
  if (user === 'admin') {
    return need === 'moderator';
  }
  return false;
}
