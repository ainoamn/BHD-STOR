/**
 * BHD-SESSION-POLICY.md — the product session lasts until explicit sign-out.
 * 400 days is the practical Chromium cookie ceiling, not an idle timeout.
 * JWT `exp` must equal the cookie maxAge; env cannot shorten it.
 */
export const PRODUCT_SESSION_MAX_AGE = '400d';
export const PRODUCT_SESSION_MAX_AGE_SEC = 400 * 24 * 60 * 60;
export const PRODUCT_SESSION_MAX_AGE_MS = PRODUCT_SESSION_MAX_AGE_SEC * 1000;
