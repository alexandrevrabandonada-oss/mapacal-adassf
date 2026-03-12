import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type ModerationReportItem = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: string;
  condition: string;
  neighborhood: string | null;
  note: string | null;
  lat: number;
  lng: number;
  needs_review: boolean;
  accuracy_m: number | null;
  verification_count: number;
  is_verified: boolean;
};

export type ListForModerationResult = {
  ok: boolean;
  items: ModerationReportItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "not-authenticated" | "permission-denied" | "db-error";
};

/**
 * Lista reports para moderação (exige role moderator/admin).
 * Server-only.
 */
export async function listReportsForModeration(
  status?: string,
  limit: number = 100,
): Promise<ListForModerationResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      items: [],
      message: "Supabase nao configurado no servidor",
      reason: "env-missing",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        items: [],
        message: "Cliente Supabase nao disponivel",
        reason: "env-missing",
      };
    }

    const { data, error } = await supabase.rpc("list_reports_for_moderation", {
      in_status: status || null,
      in_limit: limit,
    });

    if (error) {
      if (error.code === "42883") {
        return {
          ok: false,
          items: [],
          message: "RPC list_reports_for_moderation nao encontrada (aplicar T06_moderation.sql)",
          reason: "rpc-missing",
        };
      }

      // PGRST301 = permissão negada (not authenticated)
      if (error.message.includes("Autenticacao necessaria")) {
        return {
          ok: false,
          items: [],
          message: "Usuario nao autenticado",
          reason: "not-authenticated",
        };
      }

      // Permissão negada (role insuficiente)
      if (error.message.includes("Permissao insuficiente")) {
        return {
          ok: false,
          items: [],
          message: "Acesso negado: somente moderadores",
          reason: "permission-denied",
        };
      }

      console.error("[listReportsForModeration] RPC error:", error);
      return {
        ok: false,
        items: [],
        message: `Erro ao listar reports: ${error.message}`,
        reason: "db-error",
      };
    }

    if (!data) {
      return {
        ok: true,
        items: [],
      };
    }

    return {
      ok: true,
      items: data as ModerationReportItem[],
    };
  } catch (err) {
    console.error("[listReportsForModeration] error:", err);
    return {
      ok: false,
      items: [],
      message: "Erro interno ao listar reports",
      reason: "db-error",
    };
  }
}
