import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type ModerateReportResult = {
  ok: boolean;
  message: string;
  newStatus?: string;
  reason?: "env-missing" | "rpc-missing" | "not-authenticated" | "permission-denied" | "invalid-action" | "not-found" | "db-error";
};

/**
 * Modera um report (publish, hide, request_review).
 * Exige role moderator/admin.
 * Server-only.
 */
export async function moderateSidewalkReport(
  reportId: string,
  action: "publish" | "hide" | "request_review",
  reason?: string,
): Promise<ModerateReportResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado no servidor",
      reason: "env-missing",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        message: "Cliente Supabase nao disponivel",
        reason: "env-missing",
      };
    }

    const { data, error } = await supabase.rpc("moderate_sidewalk_report", {
      in_report_id: reportId,
      in_action: action,
      in_reason: reason || null,
    });

    if (error) {
      if (error.code === "42883") {
        return {
          ok: false,
          message: "RPC moderate_sidewalk_report nao encontrada (aplicar T06_moderation.sql)",
          reason: "rpc-missing",
        };
      }

      console.error("[moderateSidewalkReport] RPC error:", error);
      return {
        ok: false,
        message: `Erro ao moderar: ${error.message}`,
        reason: "db-error",
      };
    }

    if (!data) {
      return {
        ok: false,
        message: "RPC retornou nulo inesperado",
        reason: "db-error",
      };
    }

    // RPC retorna JSON com { ok, message, new_status? }
    if (!data.ok) {
      // Mapear razões comuns
      if (data.message.includes("Autenticacao necessaria")) {
        return {
          ok: false,
          message: data.message,
          reason: "not-authenticated",
        };
      }
      if (data.message.includes("Permissao insuficiente")) {
        return {
          ok: false,
          message: data.message,
          reason: "permission-denied",
        };
      }
      if (data.message.includes("Report nao encontrado")) {
        return {
          ok: false,
          message: data.message,
          reason: "not-found",
        };
      }
      if (data.message.includes("Acao invalida")) {
        return {
          ok: false,
          message: data.message,
          reason: "invalid-action",
        };
      }

      return {
        ok: false,
        message: data.message,
        reason: "db-error",
      };
    }

    return {
      ok: true,
      message: data.message,
      newStatus: data.new_status,
    };
  } catch (err) {
    console.error("[moderateSidewalkReport] error:", err);
    return {
      ok: false,
      message: "Erro interno ao moderar report",
      reason: "db-error",
    };
  }
}
