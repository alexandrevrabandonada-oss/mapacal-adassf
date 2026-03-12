import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { isValidSidewalkCondition, type SidewalkCondition } from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PriorityMapPoint = {
  id: string;
  lat: number;
  lng: number;
  neighborhood: string;
  condition: SidewalkCondition;
  verification_count: number;
  is_verified: boolean;
};

export type GetPriorityMapPointsResult = {
  ok: boolean;
  items: PriorityMapPoint[];
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
  item: Database["public"]["Functions"]["get_priority_map_points"]["Returns"][number]
): PriorityMapPoint | null {
  if (!item.neighborhood || !isValidSidewalkCondition(item.condition)) {
    return null;
  }

  return {
    id: item.id,
    lat: Number(item.lat),
    lng: Number(item.lng),
    neighborhood: item.neighborhood,
    condition: item.condition,
    verification_count: Number(item.verification_count ?? 0),
    is_verified: item.is_verified
  };
}

export async function getPriorityMapPoints(
  days: number = 90,
  condition?: SidewalkCondition
): Promise<GetPriorityMapPointsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Pontos prioritarios indisponiveis neste ambiente."
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

  const { data, error } = await supabase.rpc("get_priority_map_points", {
    in_days: days,
    in_condition: condition ?? null
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
          : "Falha ao buscar pontos prioritarios para o mapa."
    };
  }

  const items = (data ?? [])
    .map((item: Database["public"]["Functions"]["get_priority_map_points"]["Returns"][number]) => normalizeItem(item))
    .filter((item: PriorityMapPoint | null): item is PriorityMapPoint => item !== null);

  return {
    ok: true,
    items,
    message: "Pontos prioritarios carregados."
  };
}
