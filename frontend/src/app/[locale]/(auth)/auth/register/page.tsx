import { redirect } from 'next/navigation';
import RegisterForm from './RegisterForm';

function safeReturnTo(raw: string | undefined, locale: string): string {
  const fallback = `/${locale}`;
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes('://') || raw.includes('\\')) return fallback;
  return raw;
}

/**
 * End-user signup lives on identity. The store form remains at ?local=1
 * for staff/seller onboarding only (BHD-UNIFIED-LOGIN-AND-APPS.md §4.7 / §5).
 */
export default function RegisterPage({
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

  return <RegisterForm />;
}
