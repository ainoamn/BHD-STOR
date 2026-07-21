import type { UserRole } from "@/types";

export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSellerRole(role?: UserRole | string | null): boolean {
  return role === "vendor" || role === "seller" || isAdminRole(role);
}
