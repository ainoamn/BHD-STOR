import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuthService, AuthResponse } from '../auth.service';
import { CompleteBhdOidcDto } from '../dto/complete-bhd-oidc.dto';
import {
  BHD_STORE_CLIENT_ID,
  DEFAULT_BHD_IDENTITY_ISSUER,
  allowedIssuers,
  assertOidcClaims,
  decodeJwtPayload,
  normalizeIssuer,
} from '../utils/bhd-identity.util';

type Discovery = {
  issuer: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
};

@Injectable()
export class BhdIdentityService {
  private readonly logger = new Logger(BhdIdentityService.name);
  private discovery: { at: number; value: Discovery } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  issuer(): string {
    return normalizeIssuer(
      this.configService.get<string>('BHD_IDENTITY_ISSUER', DEFAULT_BHD_IDENTITY_ISSUER),
    );
  }

  clientId(): string {
    return this.configService.get<string>('BHD_OAUTH_CLIENT_ID', BHD_STORE_CLIENT_ID).trim() ||
      BHD_STORE_CLIENT_ID;
  }

  isConfigured(): boolean {
    return Boolean(this.clientSecret());
  }

  async completeLogin(dto: CompleteBhdOidcDto): Promise<AuthResponse> {
    const issuer = this.issuer();
    const clientId = this.clientId();
    const discovery = await this.loadDiscovery(issuer);

    let idToken = dto.idToken?.trim() || '';
    let accessToken = dto.accessToken?.trim() || '';

    if (!idToken || !accessToken) {
      const secret = this.clientSecret();
      if (!secret) {
        throw new ServiceUnavailableException('BHD Identity client secret is not configured');
      }
      if (!dto.code || !dto.redirectUri || !dto.codeVerifier) {
        throw new UnauthorizedException('BHD Identity authorization code is missing');
      }
      const tokenRes = await fetch(discovery.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: dto.code,
          redirect_uri: dto.redirectUri,
          client_id: clientId,
          client_secret: secret,
          code_verifier: dto.codeVerifier,
        }),
      });
      if (!tokenRes.ok) {
        this.logger.warn(`Identity token exchange failed: ${tokenRes.status}`);
        throw new UnauthorizedException('BHD Identity token exchange failed');
      }
      const tokens = (await tokenRes.json()) as {
        id_token?: string;
        access_token?: string;
      };
      idToken = tokens.id_token || '';
      accessToken = tokens.access_token || '';
    }

    if (!idToken || !accessToken) {
      throw new UnauthorizedException('BHD Identity did not return id_token');
    }

    this.verifyIdTokenIfPossible(idToken, issuer, clientId);

    const claims = assertOidcClaims(decodeJwtPayload(idToken), {
      issuer: allowedIssuers(issuer),
      audience: clientId,
      nonce: dto.nonce,
    });

    const userinfo = await this.fetchUserinfo(discovery.userinfo_endpoint, accessToken);
    if (userinfo.sub !== claims.sub || userinfo.email !== claims.email) {
      throw new UnauthorizedException('BHD Identity userinfo did not match id_token');
    }
    if (!userinfo.emailVerified) {
      throw new UnauthorizedException('BHD Identity email is not verified');
    }

    return this.authService.loginWithBhdIdentity({
      sub: claims.sub,
      email: claims.email,
      name: userinfo.name || claims.name,
      picture: userinfo.picture ?? claims.picture,
      phone: userinfo.phone ?? claims.phone,
    });
  }

  private clientSecret(): string {
    return this.configService.get<string>('BHD_OAUTH_CLIENT_SECRET', '').trim();
  }

  private async loadDiscovery(issuer: string): Promise<Discovery> {
    const now = Date.now();
    if (this.discovery && now - this.discovery.at < 10 * 60 * 1000) {
      return this.discovery.value;
    }
    const fallback: Discovery = {
      issuer,
      token_endpoint: `${issuer}/oauth/token`,
      userinfo_endpoint: `${issuer}/oauth/userinfo`,
      jwks_uri: `${issuer}/oauth/jwks.json`,
    };
    try {
      const res = await fetch(`${issuer}/.well-known/openid-configuration`);
      if (!res.ok) {
        this.discovery = { at: now, value: fallback };
        return fallback;
      }
      const json = (await res.json()) as Partial<Discovery>;
      const value: Discovery = {
        issuer: normalizeIssuer(json.issuer || issuer),
        token_endpoint: json.token_endpoint || fallback.token_endpoint,
        userinfo_endpoint: json.userinfo_endpoint || fallback.userinfo_endpoint,
        jwks_uri: json.jwks_uri || fallback.jwks_uri,
      };
      this.discovery = { at: now, value };
      return value;
    } catch {
      this.discovery = { at: now, value: fallback };
      return fallback;
    }
  }

  private verifyIdTokenIfPossible(idToken: string, issuer: string, audience: string): void {
    const hsSecret = this.configService.get<string>('BHD_IDENTITY_TOKEN_SECRET', '').trim();
    if (!hsSecret) {
      return;
    }
    try {
      jwt.verify(idToken, hsSecret, {
        algorithms: ['HS256'],
        issuer: allowedIssuers(issuer),
        audience,
      });
    } catch {
      throw new UnauthorizedException('BHD Identity id_token signature is invalid');
    }
  }

  private async fetchUserinfo(
    endpoint: string,
    accessToken: string,
  ): Promise<{
    sub: string;
    email: string;
    emailVerified: boolean;
    name: string;
    picture: string | null;
    phone: string | null;
  }> {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new UnauthorizedException('BHD Identity userinfo failed');
    }
    const json = (await res.json()) as Record<string, unknown>;
    const email = typeof json.email === 'string' ? json.email.trim().toLowerCase() : '';
    return {
      sub: typeof json.sub === 'string' ? json.sub : '',
      email,
      emailVerified: json.email_verified === true || json.email_verified === 'true',
      name: typeof json.name === 'string' ? json.name : email,
      picture: typeof json.picture === 'string' ? json.picture : null,
      phone: typeof json.phone_number === 'string' ? json.phone_number : null,
    };
  }
}
