import { BHD_APPS } from "@/lib/bhd/apps";
import { DEFAULT_IDENTITY_ISSUER } from "@/lib/bhd/issuer";

export function pageOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin.replace(/\/$/, "");
}

export function isIdentityOrigin(origin = pageOrigin()) {
  const here = origin.replace(/\/$/, "");
  return here === DEFAULT_IDENTITY_ISSUER || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(here);
}

export function identityApiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && isIdentityOrigin()) return normalized;
  return `${DEFAULT_IDENTITY_ISSUER.replace(/\/$/, "")}${normalized}`;
}

export function identityFetch(path: string, init?: RequestInit) {
  return fetch(identityApiUrl(path), {
    cache: "no-store",
    credentials: "include",
    ...init,
  });
}

export function currentReturnPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search || ""}` || "/";
}

export function productStartPath(returnTo = "/") {
  const path = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return `/api/auth/bhd/start?returnTo=${encodeURIComponent(path)}`;
}

export function allowedBhdUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url.origin)) {
      return "";
    }
    if (url.origin === DEFAULT_IDENTITY_ISSUER) return url.toString();
    if (BHD_APPS.some((app) => app.origin.replace(/\/$/, "") === url.origin)) return url.toString();
    if (url.hostname === "bhd-om.com" || url.hostname.endsWith(".bhd-om.com")) return url.toString();
  } catch {
    /* ignore */
  }
  return "";
}

/** Only path that may open /login?add=1 — never use this for switch. */
export function addAccountUrl() {
  const next =
    typeof window === "undefined"
      ? "/account"
      : `/auth/continue?to=${encodeURIComponent(window.location.href)}`;
  return `${identityApiUrl("/login")}?add=1&next=${encodeURIComponent(next)}`;
}

/**
 * After switch/logout-to-remaining: wipe product session cookies then rebind via start.
 * Never opens /login?add=1.
 */
export function applyAccountIsolation() {
  if (typeof window === "undefined") return;
  const here = currentReturnPath();
  window.location.assign(productStartPath(here));
}
