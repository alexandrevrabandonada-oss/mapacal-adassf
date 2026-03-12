import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

type ProfileRole = "user" | "moderator" | "admin";

export type CurrentProfileResult = {
  ok: boolean;
  isAuthenticated: boolean;
  userId?: string;
  role?: ProfileRole;
  canModerate: boolean;
  message?: string;
  reason?: "env-missing" | "not-authenticated" | "db-error" | "no-profile";
};

/**
 * Obtém perfil do usuário atual e verifica se pode moderar.
 * Server-only, safe degradation.
 */
export async function getCurrentProfile(): Promise<CurrentProfileResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      isAuthenticated: false,
      canModerate: false,
      message: "Supabase nao configurado no servidor",
      reason: "env-missing",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        isAuthenticated: false,
        canModerate: false,
        message: "Cliente Supabase nao disponivel",
        reason: "env-missing",
      };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: true,
        isAuthenticated: false,
        canModerate: false,
        message: "Usuario nao autenticado",
        reason: "not-authenticated",
      };
    }

    // Buscar profile com role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Profile ainda não criado (possível em novo cadastro)
      return {
        ok: true,
        isAuthenticated: true,
        userId: user.id,
        role: "user",
        canModerate: false,
        message: "Profile nao encontrado, assumindo role user",
        reason: "no-profile",
      };
    }

    const role = profile.role as ProfileRole;
    const canModerate = role === "moderator" || role === "admin";

    return {
      ok: true,
      isAuthenticated: true,
      userId: user.id,
      role,
      canModerate,
    };
  } catch (err) {
    console.error("[getCurrentProfile] error:", err);
    return {
      ok: false,
      isAuthenticated: false,
      canModerate: false,
      message: "Erro interno ao obter perfil",
      reason: "db-error",
    };
  }
}
