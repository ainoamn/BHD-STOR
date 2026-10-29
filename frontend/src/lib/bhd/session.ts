import { identitySessionMaxAgeSecCached, SESSION_MAX_AGE_FALLBACK } from "@/lib/bhd/runtime";

/**
 * Product session cookie/JWT lifetime — sourced from id.bhd-om.com/api/bhd/runtime (~5min cache).
 * @deprecated Use identitySessionMaxAgeSecCached() directly.
 */
export const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_FALLBACK;

export function productSessionMaxAgeSec() {
  return identitySessionMaxAgeSecCached();
}
