"use client";

import { identityFetch, isIdentityOrigin, productStartPath } from "@/lib/identity/client";
import { useEffect } from "react";

/**
 * Direct link to this product: if identity has an active account and the product
 * session is missing or bound to a different sub/email, rebind silently via start.
 * Never /login?add=1, never force logout of other roster accounts.
 */
export function BhdSilentSso() {
  useEffect(() => {
    const path = window.location.pathname;
    if (
      isIdentityOrigin() ||
      path.startsWith("/login") ||
      path.includes("/auth/") ||
      path.startsWith("/oauth") ||
      path.startsWith("/api/") ||
      path.startsWith("/callback")
    ) {
      return;
    }

    let cancelled = false;
    const here = `${window.location.pathname}${window.location.search || ""}` || "/";
    const guardKey = `bhd-sso:${here}`;
    if (sessionStorage.getItem(guardKey) === "1") return;

    identityFetch("/api/auth/me")
      .then((response) => response.json())
      .then(async (identity: { user?: { id?: string; email?: string } | null }) => {
        if (cancelled || !identity.user?.id) return;
        const localResponse = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const local = (await localResponse.json().catch(() => ({}))) as {
          user?: { id?: string; email?: string } | null;
        };
        if (cancelled) return;
        const localId = local.user?.id || "";
        const localEmail = (local.user?.email || "").toLowerCase();
        const identityId = identity.user.id;
        const identityEmail = (identity.user.email || "").toLowerCase();
        const matched =
          Boolean(localId) &&
          (localId === identityId ||
            (localEmail && identityEmail && localEmail === identityEmail));
        if (matched) return;
        sessionStorage.setItem(guardKey, "1");
        window.location.replace(productStartPath(here));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
