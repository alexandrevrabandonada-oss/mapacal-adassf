import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface NeighborhoodPeriodDelta {
  neighborhood: string;
  current_count: number;
  baseline_count: number;
  current_per_day: number;
  baseline_per_day: number;
  delta_per_day: number;
  delta_pct: number | null;
  current_blocked: number;
  baseline_blocked: number;
  current_verified: number;
  baseline_verified: number;
  current_with_photo: number;
  baseline_with_photo: number;
}

export interface GetNeighborhoodPeriodDeltasResult {
  ok: boolean;
  deltas: NeighborhoodPeriodDelta[];
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
 * Busca deltas por bairro entre dois períodos
 * Inclui dados sobre blocked, verified, photos
 */
export async function getNeighborhoodPeriodDeltas(
  currentDays: number = 7,
  baselineDays: number = 30
): Promise<GetNeighborhoodPeriodDeltasResult> {
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

    const { data, error } = await supabase.rpc("get_neighborhood_period_deltas", {
      in_current_days: currentDays,
      in_baseline_days: baselineDays
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        deltas: [],
        reason,
        message: `Erro ao buscar deltas por bairro: ${error.message}`
      };
    }

    const deltas = (data || []) as NeighborhoodPeriodDelta[];

    return {
      ok: true,
      deltas,
      message: `${deltas.length} bairros carregados`
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
