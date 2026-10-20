import { BHD_STORE_CLIENT_ID } from "@/lib/bhd-identity";
import {
  addAccountUrl,
  applyAccountIsolation,
  identityApiUrl,
  identityFetch,
  productStartPath,
} from "@/lib/identity/client";

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

export type IdentityMePayload = {
  user: IdentityAccount | null;
  accounts: IdentityAccount[];
  platformAdmin: boolean;
};

type IdentityMeResponse = {
  user?: IdentityAccount | null;
  accounts?: IdentityAccount[];
  platformAdmin?: boolean;
};

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

function normalizeMe(data: IdentityMeResponse): IdentityMePayload {
  const user = data.user ? normalizeAccount(data.user) : null;
  const accounts = (data.accounts?.length ? data.accounts : user ? [user] : []).map(normalizeAccount);
  return { user, accounts, platformAdmin: Boolean(data.platformAdmin) };
}

export async function fetchIdentityAccounts(): Promise<IdentityMePayload> {
  try {
    const response = await identityFetch("/api/auth/me");
    if (!response.ok) return { user: null, accounts: [], platformAdmin: false };
    return normalizeMe((await response.json()) as IdentityMeResponse);
  } catch {
    return { user: null, accounts: [], platformAdmin: false };
  }
}

export async function switchIdentityAccount(sub: string): Promise<boolean> {
  const response = await identityFetch("/api/auth/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sub }),
  });
  return response.ok;
}

export async function logoutIdentityAccount(all: boolean): Promise<IdentityMePayload | null> {
  const response = await identityFetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all }),
  });
  if (!response.ok) return null;
  return normalizeMe((await response.json().catch(() => ({}))) as IdentityMeResponse);
}

export function storeSilentStartHref(returnTo?: string | null): string {
  const path =
    returnTo &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("://")
      ? returnTo
      : STORE_WORKSPACE_PATH;
  return productStartPath(path);
}

export function identityAddAccountHref(): string {
  return addAccountUrl();
}

export function identityEndSessionHref(all = false): string {
  const url = new URL(identityApiUrl("/oauth/end-session"));
  url.searchParams.set("client_id", BHD_STORE_CLIENT_ID);
  if (typeof window !== "undefined") {
    url.searchParams.set("post_logout_redirect_uri", `${window.location.origin}/`);
  }
  if (all) url.searchParams.set("all", "1");
  return url.toString();
}

export async function clearProductSession(): Promise<void> {
  try {
    await fetch("/api/auth/bhd/logout?local=1", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    /* cookies cleared by route or ignored */
  }
}

export { applyAccountIsolation, addAccountUrl };
