import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { isValidSidewalkCondition } from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NeighborhoodPriorityItem = {
  neighborhood: string;
  total_published: number;
  total_verified: number;
  total_blocked: number;
  total_bad: number;
  total_good: number;
  with_photo: number;
  priority_score: number;
};

export type GetNeighborhoodPriorityBreakdownResult = {
  ok: boolean;
  items: NeighborhoodPriorityItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

function normalizeItem(
  item: Database["public"]["Functions"]["get_neighborhood_priority_breakdown"]["Returns"][number]
): NeighborhoodPriorityItem | null {
  if (!item.neighborhood) {
    return null;
  }

  const blocked = Number(item.total_blocked ?? 0);
  const bad = Number(item.total_bad ?? 0);
  const good = Number(item.total_good ?? 0);

  if (
    (blocked > 0 && !isValidSidewalkCondition("blocked")) ||
    (bad > 0 && !isValidSidewalkCondition("bad")) ||
    (good > 0 && !isValidSidewalkCondition("good"))
  ) {
    return null;
  }

  return {
    neighborhood: item.neighborhood,
    total_published: Number(item.total_published ?? 0),
    total_verified: Number(item.total_verified ?? 0),
    total_blocked: blocked,
    total_bad: bad,
    total_good: good,
    with_photo: Number(item.with_photo ?? 0),
    priority_score: Number(item.priority_score ?? 0)
  };
}

export async function getNeighborhoodPriorityBreakdown(
  days: number = 90
): Promise<GetNeighborhoodPriorityBreakdownResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Cobertura territorial indisponivel neste ambiente."
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase indisponivel no servidor."
    };
  }

  const { data, error } = await supabase.rpc("get_neighborhood_priority_breakdown", {
    in_days: days
  });

  if (error) {
    const reason = mapRpcErrorMessage(error.code);
    return {
      ok: false,
      items: [],
      reason,
      message:
        reason === "rpc-missing"
          ? "RPC T09 nao disponivel. Aplique T09_territorial_priorities.sql no Supabase."
          : "Falha ao buscar ranking territorial."
    };
  }

  const items = (data ?? [])
    .map((item: Database["public"]["Functions"]["get_neighborhood_priority_breakdown"]["Returns"][number]) =>
      normalizeItem(item)
    )
    .filter((item: NeighborhoodPriorityItem | null): item is NeighborhoodPriorityItem => item !== null);

  return {
    ok: true,
    items,
    message: "Ranking territorial carregado."
  };
}
