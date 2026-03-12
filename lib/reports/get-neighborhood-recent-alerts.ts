import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { isValidSidewalkCondition } from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NeighborhoodRecentAlertItem = {
  id: string;
  created_at: string;
  neighborhood: string;
  condition: "good" | "bad" | "blocked";
  verification_count: number;
  is_verified: boolean;
  has_photo: boolean;
};

export type GetNeighborhoodRecentAlertsResult = {
  ok: boolean;
  items: NeighborhoodRecentAlertItem[];
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
  item: Database["public"]["Functions"]["get_neighborhood_recent_alerts"]["Returns"][number]
): NeighborhoodRecentAlertItem | null {
  if (!item.neighborhood || !isValidSidewalkCondition(item.condition)) {
    return null;
  }

  return {
    id: item.id,
    created_at: item.created_at,
    neighborhood: item.neighborhood,
    condition: item.condition,
    verification_count: Number(item.verification_count ?? 0),
    is_verified: item.is_verified,
    has_photo: item.has_photo
  };
}

export async function getNeighborhoodRecentAlerts(
  limit: number = 20,
  days: number = 90
): Promise<GetNeighborhoodRecentAlertsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Alertas territoriais indisponiveis neste ambiente."
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

  const { data, error } = await supabase.rpc("get_neighborhood_recent_alerts", {
    in_limit: limit,
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
          ? "RPC T10 nao disponivel. Aplique T10_time_windows_and_snapshots.sql no Supabase."
          : "Falha ao buscar alertas territoriais."
    };
  }

  const items = (data ?? [])
    .map((item: Database["public"]["Functions"]["get_neighborhood_recent_alerts"]["Returns"][number]) =>
      normalizeItem(item)
    )
    .filter((item: NeighborhoodRecentAlertItem | null): item is NeighborhoodRecentAlertItem => item !== null);

  return {
    ok: true,
    items,
    message: "Alertas territoriais carregados."
  };
}
