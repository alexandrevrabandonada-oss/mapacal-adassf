import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ConditionBreakdown = {
  condition: string;
  count_published: number;
  count_pending: number;
  count_total: number;
};

export type NeighborhoodBreakdown = {
  neighborhood: string;
  count_published: number;
  count_pending: number;
  count_total: number;
};

export type TimelineEntry = {
  report_date: string;
  count_created: number;
  count_published: number;
};

export type TransparencyBreakdowns = {
  conditions: ConditionBreakdown[];
  neighborhoods: NeighborhoodBreakdown[];
  timeline: TimelineEntry[];
};

export type GetTransparencyBreakdownsResult = {
  ok: boolean;
  breakdowns: TransparencyBreakdowns | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function getTransparencyBreakdowns(
  days: number = 30
): Promise<GetTransparencyBreakdownsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      breakdowns: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Breakdowns indisponiveis neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        breakdowns: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    // Buscar breakdown por condicao
    const { data: conditionData, error: conditionError } = await supabase.rpc(
      "get_condition_breakdown",
      { in_days: days }
    );

    if (conditionError) {
      const reason = mapRpcErrorMessage(conditionError.code);
      return {
        ok: false,
        breakdowns: null,
        reason,
        message: reason === "rpc-missing"
          ? "RPC nao disponivel. Aplique T08_transparency_exports.sql no Supabase."
          : `Erro ao buscar breakdown: ${conditionError.message}`
      };
    }

    // Buscar breakdown por bairro
    const { data: neighborhoodData, error: neighborhoodError } = await supabase.rpc(
      "get_neighborhood_breakdown",
      { in_days: days, in_limit: 20 }
    );

    if (neighborhoodError) {
      console.error("[getTransparencyBreakdowns] neighborhood error:", neighborhoodError);
    }

    // Buscar serie temporal
    const { data: timelineData, error: timelineError } = await supabase.rpc(
      "get_timeline_data",
      { in_days: days }
    );

    if (timelineError) {
      console.error("[getTransparencyBreakdowns] timeline error:", timelineError);
    }

    type ConditionRpc = {
      condition: string;
      count_published: number;
      count_pending: number;
      count_total: number;
    };

    type NeighborhoodRpc = {
      neighborhood: string;
      count_published: number;
      count_pending: number;
      count_total: number;
    };

    type TimelineRpc = {
      report_date: string;
      count_created: number;
      count_published: number;
    };

    const breakdowns: TransparencyBreakdowns = {
      conditions: (conditionData as ConditionRpc[] || []).map((item) => ({
        condition: item.condition,
        count_published: item.count_published,
        count_pending: item.count_pending,
        count_total: item.count_total
      })),
      neighborhoods: (neighborhoodData as NeighborhoodRpc[] || []).map((item) => ({
        neighborhood: item.neighborhood,
        count_published: item.count_published,
        count_pending: item.count_pending,
        count_total: item.count_total
      })),
      timeline: (timelineData as TimelineRpc[] || []).map((item) => ({
        report_date: item.report_date,
        count_created: item.count_created,
        count_published: item.count_published
      }))
    };

    return {
      ok: true,
      breakdowns,
      message: "Breakdowns obtidos com sucesso"
    };
  } catch (err) {
    console.error("[getTransparencyBreakdowns] error:", err);
    return {
      ok: false,
      breakdowns: null,
      reason: "db-error",
      message: "Erro interno ao buscar breakdowns"
    };
  }
}
