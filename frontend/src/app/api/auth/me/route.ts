import { NextRequest, NextResponse } from "next/server";
import { backendOrigin } from "@/lib/bhd-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Product binding for BhdSilentSso — returns identity-comparable id (bhdSub preferred).
 * Do not redirect; callers compare with id.bhd-om.com/api/auth/me.
 */
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const upstream = await fetch(`${backendOrigin(request.url)}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        cookie,
        accept: "application/json",
      },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const body = (await upstream.json().catch(() => ({}))) as {
      success?: boolean;
      data?: { id?: string; email?: string; bhdSub?: string | null };
      id?: string;
      email?: string;
      bhdSub?: string | null;
    };
    const raw = body.data || body;
    if (!raw?.id && !raw?.email) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: raw.bhdSub || raw.id,
        email: raw.email || "",
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
