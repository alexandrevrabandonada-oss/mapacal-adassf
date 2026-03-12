import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface PeriodDeltaSummary {
  current_days: number;
  baseline_days: number;
  current_published: number;
  baseline_published: number;
  current_per_day: number;
  baseline_per_day: number;
  published_delta_per_day: number;
  published_delta_pct: number | null;
  current_verified: number;
  baseline_verified: number;
  verified_delta_per_day: number;
  verified_delta_pct: number | null;
  current_blocked: number;
  baseline_blocked: number;
  blocked_delta_per_day: number;
  blocked_delta_pct: number | null;
}

export interface GetPeriodDeltaSummaryResult {
  ok: boolean;
  summary: PeriodDeltaSummary | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "no-data";
}

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

/**
 * Busca resumo de deltas entre dois períodos
 * Compara published, verified, blocked por taxa diária
 */
export async function getPeriodDeltaSummary(
  currentDays: number = 7,
  baselineDays: number = 30,
  neighborhood?: string
): Promise<GetPeriodDeltaSummaryResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      summary: null,
      reason: "env-missing",
      message: "Supabase nao configurado"
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

    const { data, error } = await supabase.rpc("get_period_delta_summary", {
      in_current_days: currentDays,
      in_baseline_days: baselineDays,
      in_neighborhood: neighborhood || null
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        summary: null,
        reason,
        message: `Erro ao buscar deltas: ${error.message}`
      };
    }

    if (!data || data.length === 0) {
      return {
        ok: true,
        summary: null,
        reason: "no-data",
        message: "Sem dados para os períodos especificados"
      };
    }

    const summary = data[0] as PeriodDeltaSummary;

    return {
      ok: true,
      summary,
      message: "Deltas carregados com sucesso"
    };
  } catch (err) {
    return {
      ok: false,
      summary: null,
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
