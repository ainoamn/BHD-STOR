export const DEMO_ACCESS_TOKEN = "demo-access-token";
export const DEMO_REFRESH_TOKEN = "demo-refresh-token";

export function isDemoToken(token: string | null | undefined): boolean {
  return token === DEMO_ACCESS_TOKEN;
}
