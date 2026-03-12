import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TemporalHotspotItem = {
  neighborhood: string;
  condition: string;
  count: number;
  verified_count: number;
  blocked_count: number;
  latest_bucket: string;
  hotspot_score: number;
};

export type GetTemporalHotspotsResult = {
  ok: boolean;
  items: TemporalHotspotItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "no-data";
};

function mapRpcErrorReason(code?: string): "rpc-missing" | "db-error" {
  return code === "42883" ? "rpc-missing" : "db-error";
}

export async function getTemporalHotspots(
  days: number = 90,
  limit: number = 20
): Promise<GetTemporalHotspotsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Hotspots temporais indisponiveis."
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Cliente Supabase indisponivel no servidor."
    };
  }

  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 90;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;

  const { data, error } = await supabase.rpc("get_temporal_hotspots", {
    in_days: safeDays,
    in_limit: safeLimit
  });

  if (error) {
    const reason = mapRpcErrorReason(error.code);
    return {
      ok: false,
      items: [],
      reason,
      message:
        reason === "rpc-missing"
          ? "RPC T12 nao disponivel. Aplique T12_timeline_hotspots.sql no Supabase."
          : "Falha ao carregar hotspots temporais."
    };
  }

  type RpcRow = {
    neighborhood: string;
    condition: string;
    count: number;
    verified_count: number;
    blocked_count: number;
    latest_bucket: string;
    hotspot_score: number;
  };

  const items = ((data as RpcRow[]) ?? []).map((row) => ({
    neighborhood: row.neighborhood,
    condition: row.condition,
    count: Number(row.count ?? 0),
    verified_count: Number(row.verified_count ?? 0),
    blocked_count: Number(row.blocked_count ?? 0),
    latest_bucket: row.latest_bucket,
    hotspot_score: Number(row.hotspot_score ?? 0)
  }));

  if (items.length === 0) {
    return {
      ok: true,
      items: [],
      reason: "no-data",
      message: "Sem hotspots para o recorte escolhido."
    };
  }

  return {
    ok: true,
    items,
    message: "Hotspots temporais carregados com sucesso."
  };
}
