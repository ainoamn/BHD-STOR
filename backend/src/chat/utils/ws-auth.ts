/**
 * Extract Bearer / handshake / cookie token for Socket.IO clients.
 */
export function extractWsHandshakeToken(handshake: {
  auth?: { token?: unknown };
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}): string | null {
  const fromAuth = handshake.auth?.token;
  if (typeof fromAuth === 'string' && fromAuth.trim()) {
    return fromAuth.trim();
  }

  const authHeader = handshake.headers?.authorization;
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }

  const fromQuery = handshake.query?.token;
  if (typeof fromQuery === 'string' && fromQuery.trim()) {
    return fromQuery.trim();
  }
  if (Array.isArray(fromQuery) && fromQuery[0]) {
    return String(fromQuery[0]).trim();
  }

  const cookieHeader = handshake.headers?.cookie;
  if (typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return null;
}

export function resolveWsUserFromJwtPayload(payload: {
  sub?: string;
  userId?: string;
  email?: string;
  role?: string;
  type?: string;
}): { userId: string; email: string; role: string } | null {
  if (payload.type && payload.type !== 'access') {
    return null;
  }
  const userId = payload.sub || payload.userId;
  if (!userId) return null;
  return {
    userId,
    email: payload.email || '',
    role: payload.role || '',
  };
}
