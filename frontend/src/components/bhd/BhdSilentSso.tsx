"use client";

import {
  applyAccountIsolation,
  clearAccountRebindLock,
  isAccountRebindPending,
  isIdentityOrigin,
  productStartPath,
} from "@/lib/identity/client";
import { loadBhdIdentity } from "@/lib/identity/bhd-browser";
import { useEffect } from "react";

/**
 * Direct link: rebind product session to the active identity account silently.
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

    if (isAccountRebindPending()) return;

    let cancelled = false;

    void loadBhdIdentity().then(async (identity) => {
      if (cancelled || !identity) return;
      try {
        const { ok, body } = await identity.me();
        if (cancelled || !ok || !body.user?.id) {
          clearAccountRebindLock();
          return;
        }

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
        const identityId = body.user.id;
        const identityEmail = (body.user.email || "").toLowerCase();
        const matched =
          Boolean(localId) &&
          (localId === identityId || (localEmail && identityEmail && localEmail === identityEmail));
        if (matched) {
          clearAccountRebindLock();
          return;
        }

        const guardKey = `bhd-sso:${body.user.id}`;
        const last = Number(sessionStorage.getItem(guardKey) || "0");
        if (last && Date.now() - last < 15_000) return;
        sessionStorage.setItem(guardKey, String(Date.now()));

        if (!localId) {
          const here = `${window.location.pathname}${window.location.search || ""}` || "/";
          window.location.replace(identity.productStart(here) || productStartPath(here));
          return;
        }

        await applyAccountIsolation(body.token, { force: true });
      } catch {
        clearAccountRebindLock();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
