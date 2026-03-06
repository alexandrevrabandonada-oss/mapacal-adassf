import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateSession(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.next({ request });
  }

  try {
    // This refreshes the session if expired and updates cookies
    await supabase.auth.getSession();
  } catch {
    // Silently ignore errors during session update
  }

  return NextResponse.next({ request });
}
