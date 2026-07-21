/**
 * @fileoverview Content Security Policy Configuration
 * @description Environment-specific CSP configuration following OWASP CSP guidelines.
 * Provides strict, balanced, and report-only modes for different environments.
 */

/**
 * CSP Directive Configuration
 * Maps directive names to their allowed sources.
 */
export interface CspDirectiveConfig {
  [directive: string]: string[];
}

/**
 * Complete CSP Configuration
 */
export interface CspConfig {
  /** Directives and their values */
  directives: CspDirectiveConfig;
  /** Enable nonce generation for inline scripts/styles */
  useNonce: boolean;
  /** Report-only mode (no enforcement) */
  reportOnly: boolean;
  /** CSP report URI for violation reports */
  reportUri?: string;
  /** Report-To header endpoint group */
  reportTo?: string;
}

/**
 * Build a CSP config string from directives.
 */
export function buildCspString(directives: CspDirectiveConfig): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      const sourceStr = sources.join(' ');
      return `${directive} ${sourceStr}`;
    })
    .join('; ');
}

/**
 * Strict CSP Configuration - Production Environment
 * Most restrictive, allows only essential resources.
 */
export const strictCspConfig: CspConfig = {
  useNonce: true,
  reportOnly: false,
  reportUri: 'https://api.bhdoman.com/security/csp-report',
  reportTo: 'csp-endpoint',
  directives: {
    'default-src': ["'none'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https://*.amazonaws.com', 'https://*.cloudinary.com', 'https://images.bhdoman.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.bhdoman.com', 'wss://ws.bhdoman.com'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'"],
    'upgrade-insecure-requests': [],
  },
};

/**
 * Balanced CSP Configuration - Staging Environment
 * Allows more resources for testing while maintaining security.
 */
export const balancedCspConfig: CspConfig = {
  useNonce: true,
  reportOnly: false,
  reportUri: 'https://staging-api.bhdoman.com/security/csp-report',
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https://*.amazonaws.com', 'https://*.cloudinary.com', 'https://images.bhdoman.com', 'https://via.placeholder.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'connect-src': ["'self'", 'https://api.bhdoman.com', 'https://staging-api.bhdoman.com', 'wss://ws.bhdoman.com', 'wss://staging-ws.bhdoman.com'],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': [],
  },
};

/**
 * Development CSP Configuration
 * Relaxed for local development with hot reloading.
 */
export const developmentCspConfig: CspConfig = {
  useNonce: false,
  reportOnly: true,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'http://localhost:*', 'ws://localhost:*'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'connect-src': ["'self'", 'http://localhost:*', 'https://localhost:*', 'ws://localhost:*', 'wss://localhost:*'],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'self'"],
    'frame-src': ["'self'"],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
  },
};

/**
 * Report-Only CSP Configuration
 * For testing CSP without blocking resources.
 */
export const reportOnlyCspConfig: CspConfig = {
  useNonce: true,
  reportOnly: true,
  reportUri: 'https://api.bhdoman.com/security/csp-report',
  directives: {
    ...strictCspConfig.directives,
  },
};

/**
 * Payment pages CSP - Extra strict for checkout flow.
 */
export const paymentCspConfig: CspConfig = {
  useNonce: true,
  reportOnly: false,
  directives: {
    'default-src': ["'none'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'https://api.bhdoman.com', 'https://secure-payment.bhdoman.com'],
    'frame-src': ["'self'", 'https://secure-payment.bhdoman.com'],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'", 'https://secure-payment.bhdoman.com'],
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': [],
  },
};

/**
 * Get CSP configuration based on environment.
 */
export function getCspConfig(environment: string): CspConfig {
  switch (environment) {
    case 'production':
      return strictCspConfig;
    case 'staging':
      return balancedCspConfig;
    case 'development':
      return developmentCspConfig;
    default:
      return balancedCspConfig;
  }
}

/**
 * Payment-specific CSP config builder.
 */
export function getPaymentCspConfig(): CspConfig {
  return paymentCspConfig;
}
