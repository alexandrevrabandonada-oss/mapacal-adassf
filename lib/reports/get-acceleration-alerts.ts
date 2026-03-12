import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AccelerationAlert {
  neighborhood: string;
  condition: string;
  current_per_day: number;
  baseline_per_day: number;
  delta_per_day: number;
  delta_pct: number | null;
  severity_rank: number;
}

export interface GetAccelerationAlertsResult {
  ok: boolean;
  alerts: AccelerationAlert[];
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
 * Busca Top N pares (bairro, condição) com maior agravamento
 * Prioriza piora em bad/blocked
 */
export async function getAccelerationAlerts(
  currentDays: number = 7,
  baselineDays: number = 30,
  limit: number = 12
): Promise<GetAccelerationAlertsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      alerts: [],
      reason: "env-missing",
      message: "Supabase nao configurado"
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        alerts: [],
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("get_acceleration_alerts", {
      in_current_days: currentDays,
      in_baseline_days: baselineDays,
      in_limit: limit
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        alerts: [],
        reason,
        message: `Erro ao buscar alertas de aceleração: ${error.message}`
      };
    }

    const alerts = (data || []) as AccelerationAlert[];

    return {
      ok: true,
      alerts,
      message: `${alerts.length} alertas de aceleração carregados`
    };
  } catch (err) {
    return {
      ok: false,
      alerts: [],
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
