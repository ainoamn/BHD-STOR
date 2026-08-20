import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

function safeReturnTo(raw: string | undefined, locale: string): string {
  const fallback = `/${locale}`;
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes('://') || raw.includes('\\')) return fallback;
  return raw;
}

function isAdminPath(path: string): boolean {
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path.includes('/dashboard/admin')
  );
}

/**
 * Default: identity SSO. Local password only at ?local=1 (non-admin).
 * Admin must use /api/auth/admin-entry — never local password (§4.9 / §0.7).
 */
export default function LoginPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: {
    returnUrl?: string;
    redirect?: string;
    next?: string;
    local?: string;
  };
}) {
  const locale = params.locale || 'ar';
  const returnTo = safeReturnTo(
    searchParams.returnUrl || searchParams.redirect || searchParams.next,
    locale,
  );

  if (searchParams.local === '1' && isAdminPath(returnTo)) {
    redirect(`/api/auth/admin-entry?next=${encodeURIComponent(returnTo)}`);
  }

  if (searchParams.local !== '1') {
    redirect(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return <LoginForm />;
}
