import { DEFAULT_IDENTITY_ISSUER } from "@/lib/bhd/issuer";
import { BHD_STORE_CLIENT_ID } from "@/lib/bhd-identity";

/** Store workspace after SSO — matches frozen catalog `workspacePath`. */
export const STORE_WORKSPACE_PATH = "/dashboard";

export type AuthProviderMark = "password" | "google" | "facebook" | "whatsapp";

export type IdentityAccount = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  picture: string | null;
  providers?: AuthProviderMark[];
  googleLinked?: boolean;
  facebookLinked?: boolean;
  hasPassword?: boolean;
};

type IdentityMeResponse = {
  user?: IdentityAccount | null;
  accounts?: IdentityAccount[];
  platformAdmin?: boolean;
};

function identityUrl(path: string) {
  return `${DEFAULT_IDENTITY_ISSUER.replace(/\/$/, "")}${path}`;
}

async function identityFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(identityUrl(path), {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

function normalizeAccount(raw: IdentityAccount): IdentityAccount {
  return {
    id: raw.id,
    name: raw.name || raw.email || "",
    email: raw.email || "",
    username: raw.username ?? null,
    phone: raw.phone ?? null,
    picture: raw.picture ?? null,
    providers: (raw.providers || []) as AuthProviderMark[],
    googleLinked: raw.googleLinked,
    facebookLinked: raw.facebookLinked,
    hasPassword: raw.hasPassword,
  };
}

export async function fetchIdentityAccounts(): Promise<{
  user: IdentityAccount | null;
  accounts: IdentityAccount[];
  platformAdmin: boolean;
}> {
  try {
    const response = await identityFetch("/api/auth/me");
    if (!response.ok) return { user: null, accounts: [], platformAdmin: false };
    const data = (await response.json()) as IdentityMeResponse;
    const user = data.user ? normalizeAccount(data.user) : null;
    const accounts = (data.accounts?.length ? data.accounts : user ? [user] : []).map(normalizeAccount);
    return { user, accounts, platformAdmin: Boolean(data.platformAdmin) };
  } catch {
    return { user: null, accounts: [], platformAdmin: false };
  }
}

export async function switchIdentityAccount(sub: string): Promise<boolean> {
  const response = await identityFetch("/api/auth/switch", {
    method: "POST",
    body: JSON.stringify({ sub }),
  });
  return response.ok;
}

export async function logoutIdentityAccount(all: boolean): Promise<IdentityAccount | null> {
  const response = await identityFetch("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ all }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { user?: IdentityAccount | null };
  return data.user ? normalizeAccount(data.user) : null;
}

export function storeSilentStartHref(returnTo?: string | null): string {
  const path =
    returnTo &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("://")
      ? returnTo
      : STORE_WORKSPACE_PATH;
  return `/api/auth/bhd/start?returnTo=${encodeURIComponent(path)}`;
}

export function identityAddAccountHref(): string {
  return identityUrl("/login?add=1");
}

export function identityEndSessionHref(all = false): string {
  const url = new URL(identityUrl("/oauth/end-session"));
  url.searchParams.set("client_id", BHD_STORE_CLIENT_ID);
  if (typeof window !== "undefined") {
    url.searchParams.set("post_logout_redirect_uri", `${window.location.origin}/`);
  }
  if (all) url.searchParams.set("all", "1");
  return url.toString();
}

export async function clearProductSession(): Promise<void> {
  try {
    await fetch("/api/auth/bhd/logout?local=1", { method: "GET", credentials: "include", cache: "no-store" });
  } catch {
    /* cookies cleared by route or ignored */
  }
}
