import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();

    if (supabase) {
      try {
        await supabase.auth.exchangeCodeForSession(code);
      } catch {
        return NextResponse.redirect(`${request.nextUrl.origin}/auth/error?message=Falha+ao+trocar+codigo`);
      }
    }
  }

  return NextResponse.redirect(`${request.nextUrl.origin}/painel`);
}
