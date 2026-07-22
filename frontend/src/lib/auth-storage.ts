import type { User } from "@/types";

const USER_KEY = "bhd_user";

/**
 * Persist user profile locally. JWTs are stored in HttpOnly cookies by the API
 * (accessToken / refreshToken). A non-sensitive bhd_session flag helps middleware.
 */
export function persistAuthSession(
  accessToken: string | null | undefined,
  refreshToken: string | null | undefined,
  user: User
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Keep tokens out of document.cookie (XSS). Optional memory/localStorage
    // fallback remains in api.ts for Bearer clients / transition.
    if (accessToken) {
      localStorage.setItem("bhd_access_token", accessToken);
    }
    if (refreshToken) {
      localStorage.setItem("bhd_refresh_token", refreshToken);
    }
  } catch {
    // ignore
  }

  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `bhd_session=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  // Clear legacy JS-readable JWT cookies if present
  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refresh-token=; path=/; max-age=0; SameSite=Lax";
}

export function getPersistedUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("bhd_access_token");
    localStorage.removeItem("bhd_refresh_token");
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("bhd_demo_user");
  } catch {
    // ignore
  }

  document.cookie = "bhd_session=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refresh-token=; path=/; max-age=0; SameSite=Lax";
}
