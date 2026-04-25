import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, exchangeLongLived } from "@/lib/meta/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  if (error) return NextResponse.redirect(`${appUrl}/api-meta?error=${encodeURIComponent(error)}`);
  if (!code || !state) return NextResponse.redirect(`${appUrl}/api-meta?error=missing_code`);

  const [clientId, nonce] = state.split(":");
  const cookieStore = await cookies();
  const expected = cookieStore.get(`meta_oauth_${nonce}`)?.value;
  if (!expected || expected !== clientId) {
    return NextResponse.redirect(`${appUrl}/api-meta?error=state_mismatch`);
  }
  cookieStore.delete(`meta_oauth_${nonce}`);

  try {
    const short = await exchangeCode(code, process.env.META_REDIRECT_URI!);
    const long = await exchangeLongLived(short.access_token);
    const expires = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000).toISOString()
      : null;

    const admin = createAdminClient();
    await admin
      .from("clients")
      .update({
        meta_access_token: long.access_token,
        meta_token_expires_at: expires,
        meta_connected_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    return NextResponse.redirect(`${appUrl}/clientes/${clientId}?connected=1`);
  } catch (e: any) {
    return NextResponse.redirect(`${appUrl}/api-meta?error=${encodeURIComponent(e.message)}`);
  }
}
