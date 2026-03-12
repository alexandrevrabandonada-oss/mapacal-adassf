import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type ConfirmReportResult = {
  ok: boolean;
  message: string;
  verification_count?: number;
  is_verified?: boolean;
  reason?: "env-missing" | "rpc-missing" | "auth-required" | "not-found" | "db-error";
};

/**
 * Confirma (verifica) um ponto publicado.
 * Exige autenticacao. Duplicadas sao silenciosamente ignoradas.
 */
export async function confirmSidewalkReport(reportId: string): Promise<ConfirmReportResult> {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        message: "Autenticacao necessaria para confirmar pontos",
        reason: "auth-required",
      };
    }

    const { data, error } = await supabase.rpc("confirm_sidewalk_report", {
      in_report_id: reportId,
    });

    if (error) {
      if (error.code === "42883") {
        return {
          ok: false,
          message: "RPC confirm_sidewalk_report nao encontrada (aplicar T05_verifications.sql)",
          reason: "rpc-missing",
        };
      }
      console.error("[confirmSidewalkReport] RPC error:", error);
      return {
        ok: false,
        message: `Erro ao confirmar: ${error.message}`,
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

    // RPC retorna JSON com { ok, message, verification_count?, is_verified? }
    return {
      ok: data.ok,
      message: data.message,
      verification_count: data.verification_count,
      is_verified: data.is_verified,
    };
  } catch (err) {
    console.error("[confirmSidewalkReport] error:", err);
    return {
      ok: false,
      message: "Erro interno ao confirmar ponto",
      reason: "db-error",
    };
  }
}
