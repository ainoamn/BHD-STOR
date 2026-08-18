"use client";

import { useEffect } from "react";
import { persistAuthSession } from "@/lib/auth-storage";
import type { User } from "@/types";

export function SsoSessionHydrate() {
  useEffect(() => {
    const raw = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("bhd_sso_profile="))
      ?.slice("bhd_sso_profile=".length);
    if (!raw) return;
    try {
      const user = JSON.parse(decodeURIComponent(raw)) as User;
      persistAuthSession(null, null, user);
      document.cookie = "bhd_sso_profile=; path=/; max-age=0; SameSite=Lax";
    } catch {
      /* ignore malformed bootstrap cookie */
    }
  }, []);
  return null;
}
