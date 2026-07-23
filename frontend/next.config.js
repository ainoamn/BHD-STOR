const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

// Fail closed: never ship a production build with demo data enabled.
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
) {
  throw new Error(
    'NEXT_PUBLIC_DEMO_MODE=true is forbidden for production builds. Set it to false.',
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // i18n configuration is handled by next-intl plugin
  // Do NOT add i18n config here directly

  // Image optimization configuration
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.bhdoman.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.bhdoman.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // HTTP Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self), fullscreen=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google-analytics.com *.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "img-src 'self' blob: data: *.amazonaws.com res.cloudinary.com images.unsplash.com flagcdn.com ui-avatars.com cdn.bhdoman.com images.bhdoman.com *.googleusercontent.com",
              "font-src 'self' fonts.gstatic.com",
              "connect-src 'self' *.google-analytics.com *.googletagmanager.com api.bhdoman.com http://localhost:3001 ws://localhost:* wss://*.bhdoman.com",
              "frame-src 'self' *.stripe.com *.paypal.com",
              "media-src 'self' *.amazonaws.com res.cloudinary.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        // Cache static assets
        source: '/:path*\\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // URL Rewrites
  async rewrites() {
    const apiTarget =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:3001';

    return [
      // Same-origin proxy so browser cookies stay first-party on the Next host
      {
        source: '/api/v1/:path*',
        destination: `${apiTarget}/api/v1/:path*`,
      },
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || `${apiTarget}/api/v1`}/:path*`,
      },
      {
        source: '/api/internal/:path*',
        destination: '/api/:path*',
      },
      // Legacy URL redirects
      {
        source: '/shop/:path*',
        destination: '/products/:path*',
      },
      {
        source: '/user/:path*',
        destination: '/account/:path*',
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/dashboard/admin',
        permanent: true,
      },
      {
        source: '/vendor',
        destination: '/dashboard/vendor',
        permanent: true,
      },
    ];
  },

  // Experimental features
  experimental: {
    // Enable App Router features
    instrumentationHook: true,
    // Server Actions (stable in Next.js 14)
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Partial Prerendering (Next.js 14+)
    ppr: false,
    // Turbopack disabled — can cause chunk loading errors on Windows
    // turbo: {},
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      'recharts',
      'swiper',
      'date-fns',
      'lodash',
    ],
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Handle SVG imports as React components
    config.module.rules.push({
      test: /\\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Optimize builds
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\\\/]node_modules[\\\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  // Output configuration
  output: 'standalone',

  // Trailing slash configuration
  trailingSlash: false,

  // Powered by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Cross-Origin settings
  crossOrigin: 'anonymous',

  // Generate ETags
  generateEtags: true,

  // On-demand revalidation time
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Env validation (Next.js validates these are set at build time)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Dist directory
  distDir: '.next',

  // Clean dist directory on build
  cleanDistDir: true,

  // Configure server runtime
  serverRuntimeConfig: {
    // Will only be available on the server side
    apiSecret: process.env.API_SECRET,
  },

  // Configure public runtime config
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  },
};

module.exports = withNextIntl(nextConfig);
