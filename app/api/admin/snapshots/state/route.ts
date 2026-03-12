import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ok: true,
        state: "env-missing",
        message: "Supabase nao configurado neste ambiente."
      });
    }

    const profile = await getCurrentProfile();

    if (!profile.isAuthenticated) {
      return NextResponse.json({
        ok: true,
        state: "not-authenticated",
        message: "Usuario nao autenticado."
      });
    }

    if (!profile.canModerate) {
      return NextResponse.json({
        ok: true,
        state: "forbidden",
        role: profile.role || "user",
        message: "Sem permissao para criar snapshots. Requer moderator/admin."
      });
    }

    return NextResponse.json({
      ok: true,
      state: "ready",
      role: profile.role || "moderator",
      message: "Painel de snapshots habilitado."
    });
  } catch (err) {
    console.error("[GET /api/admin/snapshots/state]", err);
    return NextResponse.json(
      {
        ok: false,
        state: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
