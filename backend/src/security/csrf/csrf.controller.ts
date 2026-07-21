/**
 * @fileoverview CSRF Controller
 * @description Provides endpoint for clients to obtain CSRF tokens.
 * Implements the first step of the double-submit cookie pattern.
 *
 * Flow:
 * 1. Client calls GET /csrf-token (no auth required)
 * 2. Server generates a new token pair
 * 3. Server sets XSRF-TOKEN cookie with the cookie token
 * 4. Server returns the main token in the response body
 * 5. Client reads the cookie and sends token in X-XSRF-TOKEN header
 */

import {
  Controller,
  Get,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CsrfService, CSRF_TOKEN_COOKIE } from './csrf.service';

/** CSRF token response */
interface CsrfTokenResponse {
  token: string;
  expiresAt: string;
}

@Controller('csrf-token')
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name);

  constructor(private readonly csrfService: CsrfService) {}

  /**
   * GET /csrf-token
   * Generate and return a new CSRF token.
   * The token is also set as a cookie for the double-submit pattern.
   *
   * @param response - Express response object
   * @returns Token data
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  getToken(@Res({ passthrough: true }) response: Response): CsrfTokenResponse {
    const csrfToken = this.csrfService.generateToken();
    const cookieOptions = this.csrfService.getCookieOptions();

    // Set the CSRF token as a cookie (readable by JavaScript for double-submit)
    response.cookie(CSRF_TOKEN_COOKIE, csrfToken.cookieToken, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
      domain: cookieOptions.domain,
    });

    // Also set CORS headers to allow the client to read the cookie
    response.setHeader('Access-Control-Allow-Credentials', 'true');

    this.logger.debug('CSRF token generated');

    return {
      token: csrfToken.token,
      expiresAt: csrfToken.expiresAt.toISOString(),
    };
  }
}
