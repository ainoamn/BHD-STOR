import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, localePrefix } from './i18n';

// Define public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/callback',
  '/deals',
  '/products',
  '/product',
  '/categories',
  '/category',
  '/stores',
  '/store',
  '/s',
  '/search',
  '/about',
  '/contact',
  '/help',
  '/faq',
  '/terms',
  '/privacy',
  '/shipping',
  '/returns',
  '/refund-policy',
  '/seller-policy',
  '/careers',
  '/blog',
  '/sitemap',
  '/api',
  '/_next',
  '/static',
  '/images',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/sw.js',
];

// Define paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/account',
  '/cart',
  '/checkout',
  '/orders',
  '/wishlist',
  '/notifications',
  '/messages',
  '/vendor',
  '/admin',
  '/settings',
  '/profile',
  '/api/protected',
];

// Check if a path is public
function isPublicPath(pathname: string): boolean {
  // Remove locale prefix for checking
  const pathWithoutLocale = locales.reduce((path, locale) => {
    return path.replace(new RegExp(`^/${locale}`), '');
  }, pathname);

  return publicPaths.some(
    (path) =>
      pathWithoutLocale.startsWith(path) ||
      pathWithoutLocale === '' ||
      pathWithoutLocale === '/'
  );
}

// Check if a path requires authentication
function isProtectedPath(pathname: string): boolean {
  const pathWithoutLocale = locales.reduce((path, locale) => {
    return path.replace(new RegExp(`^/${locale}`), '');
  }, pathname);

  return protectedPaths.some((path) => pathWithoutLocale.startsWith(path));
}

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix,
  // Custom pathnames for localized URLs
  pathnames: {
    '/': '/',
    '/auth/login': {
      ar: '/auth/login',
      en: '/auth/login',
    },
    '/auth/register': {
      ar: '/auth/register',
      en: '/auth/register',
    },
    '/auth/forgot-password': {
      ar: '/auth/forgot-password',
      en: '/auth/forgot-password',
    },
    '/products': {
      ar: '/products',
      en: '/products',
    },
    '/categories': {
      ar: '/categories',
      en: '/categories',
    },
    '/stores': {
      ar: '/stores',
      en: '/stores',
    },
    '/cart': {
      ar: '/cart',
      en: '/cart',
    },
    '/checkout': {
      ar: '/checkout',
      en: '/checkout',
    },
    '/dashboard': {
      ar: '/dashboard',
      en: '/dashboard',
    },
    '/account': {
      ar: '/account',
      en: '/account',
    },
    '/about': {
      ar: '/about',
      en: '/about',
    },
    '/contact': {
      ar: '/contact',
      en: '/contact',
    },
    '/help': {
      ar: '/help',
      en: '/help',
    },
    '/search': {
      ar: '/search',
      en: '/search',
    },
  },
});

// Main middleware function
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/images/') ||
    pathname.match(/\\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot|pdf)$/)
  ) {
    return NextResponse.next();
  }

  // Handle health check endpoint
  if (pathname === '/health') {
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Apply next-intl middleware for locale handling
  const response = intlMiddleware(request);

  // Add security headers to all responses
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Check authentication for protected paths (client-side auth check)
  // Note: Full auth verification happens in the application layer
  if (isProtectedPath(pathname)) {
    const authToken = request.cookies.get('auth-token')?.value;
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!authToken && !refreshToken) {
      // Redirect to login with return URL
      const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

// Middleware configuration
export const config = {
  // Match all pathnames except for:
  // - /_next (Next.js internals)
  // - /static (static files)
  // - /images (image files)
  // - /api (API routes - handled separately)
  // - all root files (e.g., favicon.ico, robots.txt)
  matcher: [
    '/',
    '/(ar|en)/:path*',
    '/((?!_next|static|images|api|.*\\..*).*)',
  ],
};
