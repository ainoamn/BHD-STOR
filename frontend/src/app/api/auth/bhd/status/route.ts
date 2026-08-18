import { NextRequest, NextResponse } from 'next/server';
import {
  backendOrigin,
  identityIssuer,
  oauthClientId,
  oauthClientSecret,
} from '@/lib/bhd-identity';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const api = `${backendOrigin(request.url)}/api/v1/auth/bhd/complete`;
  return NextResponse.json({
    issuer: identityIssuer(),
    clientId: oauthClientId(),
    hasClientSecret: Boolean(oauthClientSecret()),
    backend: backendOrigin(request.url),
    completeUrl: api,
  });
}
