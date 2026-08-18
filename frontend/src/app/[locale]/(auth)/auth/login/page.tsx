import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

function safeReturnTo(raw: string | undefined, locale: string): string {
  const fallback = `/${locale}`;
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes('://') || raw.includes('\\')) return fallback;
  return raw;
}

/**
 * Default: send the shopper to the shared BHD Identity screen at id.bhd-om.com
 * (same UI as Wazen / HISAB / the portal). Local email/password remains at ?local=1.
 */
export default function LoginPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { returnUrl?: string; redirect?: string; local?: string };
}) {
  const locale = params.locale || 'ar';
  if (searchParams.local !== '1') {
    const returnTo = safeReturnTo(
      searchParams.returnUrl || searchParams.redirect,
      locale,
    );
    redirect(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return <LoginForm />;
}
