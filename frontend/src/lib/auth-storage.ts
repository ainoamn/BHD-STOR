import type { User } from "@/types";

const USER_KEY = "bhd_user";

export function persistAuthSession(
  accessToken: string,
  refreshToken: string,
  user: User
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("bhd_access_token", accessToken);
    localStorage.setItem("bhd_refresh_token", refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }

  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `auth-token=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `refresh-token=${encodeURIComponent(refreshToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;
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

  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refresh-token=; path=/; max-age=0; SameSite=Lax";
}
