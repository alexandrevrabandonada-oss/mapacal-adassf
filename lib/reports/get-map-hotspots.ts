import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { isValidSidewalkCondition } from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicMapReportItem } from "@/lib/reports/list-published-types";

export type MapHotspotItem = PublicMapReportItem & {
  hotspot_rank: number;
};

export type GetMapHotspotsResult = {
  ok: boolean;
  items: MapHotspotItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "no-data";
};

function mapRpcErrorReason(code?: string): "rpc-missing" | "db-error" {
  return code === "42883" ? "rpc-missing" : "db-error";
}

export async function getMapHotspots(
  days: number = 30,
  condition?: string,
  verifiedOnly: boolean = false
): Promise<GetMapHotspotsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Hotspots de mapa indisponiveis."
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

  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 30;

  const { data, error } = await supabase.rpc("get_map_hotspots", {
    in_days: safeDays,
    in_condition: condition || null,
    in_verified_only: verifiedOnly
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
          : "Falha ao carregar hotspots de mapa."
    };
  }

  type RpcRow = {
    id: string;
    lat: number;
    lng: number;
    neighborhood: string | null;
    condition: string;
    created_at: string;
    verification_count: number;
    is_verified: boolean;
    hotspot_rank: number;
  };

  const items: MapHotspotItem[] = [];
  for (const row of (data as RpcRow[]) ?? []) {
    if (!isValidSidewalkCondition(row.condition)) {
      continue;
    }

    items.push({
      id: row.id,
      created_at: row.created_at,
      condition: row.condition,
      lat: Number(row.lat),
      lng: Number(row.lng),
      neighborhood: row.neighborhood,
      note: null,
      verification_count: Number(row.verification_count ?? 0),
      is_verified: !!row.is_verified,
      hotspot_rank: Number(row.hotspot_rank ?? 0)
    });
  }

  if (items.length === 0) {
    return {
      ok: true,
      items: [],
      reason: "no-data",
      message: "Sem hotspots de mapa para o recorte escolhido."
    };
  }

  return {
    ok: true,
    items,
    message: "Hotspots de mapa carregados com sucesso."
  };
}
