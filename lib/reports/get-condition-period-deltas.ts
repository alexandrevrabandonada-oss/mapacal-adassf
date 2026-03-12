import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface ConditionPeriodDelta {
  condition: string;
  current_count: number;
  baseline_count: number;
  current_per_day: number;
  baseline_per_day: number;
  delta_per_day: number;
  delta_pct: number | null;
  current_verified: number;
  baseline_verified: number;
}

export interface GetConditionPeriodDeltasResult {
  ok: boolean;
  deltas: ConditionPeriodDelta[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
}

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

/**
 * Busca deltas por condição entre dois períodos
 * Ordenado por delta_per_day desc (maior agravamento primeiro)
 */
export async function getConditionPeriodDeltas(
  currentDays: number = 7,
  baselineDays: number = 30,
  neighborhood?: string
): Promise<GetConditionPeriodDeltasResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      deltas: [],
      reason: "env-missing",
      message: "Supabase nao configurado"
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        deltas: [],
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("get_condition_period_deltas", {
      in_current_days: currentDays,
      in_baseline_days: baselineDays,
      in_neighborhood: neighborhood || null
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        deltas: [],
        reason,
        message: `Erro ao buscar deltas por condição: ${error.message}`
      };
    }

    const deltas = (data || []) as ConditionPeriodDelta[];

    return {
      ok: true,
      deltas,
      message: `${deltas.length} condições carregadas`
    };
  } catch (err) {
    return {
      ok: false,
      deltas: [],
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
