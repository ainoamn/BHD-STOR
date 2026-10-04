/**
 * BHD-SESSION-POLICY.md — store session stays until explicit sign-out.
 * 400 days is the Chromium cookie ceiling, not an idle timeout. JWT `exp` matches.
 */
export const SESSION_MAX_AGE_SEC = 400 * 24 * 60 * 60;
