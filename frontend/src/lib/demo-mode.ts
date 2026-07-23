/**
 * Local mock/demo data path.
 * Hard-disabled for production builds and production app env so a mis-set
 * NEXT_PUBLIC_DEMO_MODE=true cannot bypass the real API in deployed builds.
 */
export function isDemoMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
