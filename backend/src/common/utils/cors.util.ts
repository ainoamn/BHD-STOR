/**
 * Build an explicit CORS origin allowlist. Never reflect request Origin.
 */
export function resolveCorsAllowlist(env: {
  nodeEnv?: string;
  frontendUrl?: string;
  trustedOrigins?: string;
  corsOrigin?: string;
  appUrl?: string;
  publicAppUrl?: string;
}): string[] {
  const isProd =
    String(env.nodeEnv || 'development').toLowerCase() === 'production';
  const origins = new Set<string>();

  const add = (raw?: string | null) => {
    if (!raw) return;
    for (const part of String(raw).split(',')) {
      const trimmed = part.trim();
      if (!trimmed || trimmed === '*') continue;
      try {
        origins.add(new URL(trimmed).origin);
      } catch {
        origins.add(trimmed.replace(/\/$/, ''));
      }
    }
  };

  add(env.frontendUrl);
  add(env.trustedOrigins);
  add(env.corsOrigin);
  add(env.appUrl);
  add(env.publicAppUrl);

  // Known production brand hosts (explicit, not wildcard reflection)
  if (isProd) {
    add('https://bhdoman.com');
    add('https://www.bhdoman.com');
    add('https://api.bhdoman.com');
  } else {
    add('http://localhost:3000');
    add('http://127.0.0.1:3000');
    add('http://localhost:3002');
    add('http://127.0.0.1:3002');
  }

  return [...origins];
}

/** Express/Nest CORS origin callback — deny unknown origins. */
export function createCorsOriginChecker(allowlist: string[]) {
  const allowed = new Set(allowlist);
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean | string) => void,
  ) => {
    // Non-browser / same-origin tools (curl, server-to-server) may omit Origin
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowed.has(origin)) {
      callback(null, origin);
      return;
    }
    callback(null, false);
  };
}
