import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Store admin console lives under /dashboard/admin (locale-prefixed routes still accept this path). */
const DEFAULT_ADMIN_RETURN = '/dashboard/admin';

function adminReturnTo(request: Request): string {
  const raw = new URL(request.url).searchParams.get('next')?.trim() || DEFAULT_ADMIN_RETURN;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://') || raw.includes('\\')) {
    return DEFAULT_ADMIN_RETURN;
  }
  return raw;
}

/**
 * Never send admins to ?local=1 password login.
 * Same identity session opens the store admin console after SSO.
 * Spec: BHD-UNIFIED-LOGIN-AND-APPS.md §4.9 / BHD-PRODUCT-SSO-ADMIN.md
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const returnTo = adminReturnTo(request);
  return NextResponse.redirect(
    new URL(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`, origin),
  );
}
