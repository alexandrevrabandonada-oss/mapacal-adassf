import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TransparencySummary = {
  total_published: number;
  total_verified: number;
  total_pending: number;
  total_needs_review: number;
  total_hidden: number;
};

export type GetTransparencySummaryResult = {
  ok: boolean;
  summary: TransparencySummary | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function getTransparencySummary(
  days: number = 30,
  neighborhood?: string
): Promise<GetTransparencySummaryResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      summary: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Metricas indisponiveis neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        summary: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("get_transparency_summary", {
      in_days: days,
      in_neighborhood: neighborhood || null
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        summary: null,
        reason,
        message: reason === "rpc-missing" 
          ? "RPC nao disponivel. Aplique T08_transparency_exports.sql no Supabase."
          : `Erro ao buscar resumo: ${error.message}`
      };
    }

    if (!data || data.length === 0) {
      return {
        ok: true,
        summary: null,
        message: "Sem dados de resumo disponíveis"
      };
    }

    const summary: TransparencySummary = {
      total_published: data[0].total_published,
      total_verified: data[0].total_verified,
      total_pending: data[0].total_pending,
      total_needs_review: data[0].total_needs_review,
      total_hidden: data[0].total_hidden
    };

    return {
      ok: true,
      summary,
      message: "Resumo obtido com sucesso"
    };
  } catch (err) {
    console.error("[getTransparencySummary] error:", err);
    return {
      ok: false,
      summary: null,
      reason: "db-error",
      message: "Erro interno ao buscar resumo"
    };
  }
}
