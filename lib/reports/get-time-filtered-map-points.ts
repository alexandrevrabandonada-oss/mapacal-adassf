/**
 * get-time-filtered-map-points.ts
 * Busca pontos publicados com filtro temporal
 */

import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { isValidSidewalkCondition } from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface TimeFilteredMapPoint {
  id: string;
  created_at: string;
  condition: string;
  lat: number;
  lng: number;
  neighborhood: string | null;
  note: string | null;
  verification_count: number;
  is_verified: boolean;
}

export interface TimeFilteredMapFilters {
  days?: number;
  condition?: string;
  verified?: boolean;
}

export type GetTimeFilteredMapPointsResult = {
  ok: boolean;
  items: TimeFilteredMapPoint[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

function normalizeItem(item: Record<string, unknown>): TimeFilteredMapPoint | null {
  if (!isValidSidewalkCondition(item.condition as string)) {
    return null;
  }

  return {
    id: item.id as string,
    created_at: item.created_at as string,
    condition: item.condition as string,
    lat: item.lat as number,
    lng: item.lng as number,
    neighborhood: (item.neighborhood as string | null) || null,
    note: (item.note as string | null) || null,
    verification_count: Number(item.verification_count ?? 0),
    is_verified: item.is_verified as boolean
  };
}

/**
 * Busca pontos do mapa filtrados por tempo
 * Por agora, usa listPublishedReports + filtra em memória
 * T10_time_windows_and_snapshots.sql pode adicionar RPC dedicada com filtro no banco
 */
export async function getTimeFilteredMapPoints(
  filters: TimeFilteredMapFilters = {}
): Promise<GetTimeFilteredMapPointsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Mapa indisponivel neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        items: [],
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("list_published_reports", {});

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        items: [],
        reason,
        message:
          reason === "rpc-missing"
            ? "RPC T04 nao disponivel."
            : "Falha ao buscar pontos do mapa."
      };
    }

    let items = (data ?? [])
      .map((item: Record<string, unknown>) => normalizeItem(item))
      .filter((item: TimeFilteredMapPoint | null): item is TimeFilteredMapPoint => item !== null);

    // Filtro temporal simples em memória
    // Um RPC dedicada com filtro no banco seria mais eficiente para grandes volumes
    if (filters.days && filters.days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.days);

      items = items.filter((item: TimeFilteredMapPoint) => {
        const itemDate = new Date(item.created_at);
        return itemDate >= cutoffDate;
      });
    }

    // Filtros adicionais opcionais
    if (filters.condition) {
      items = items.filter((item: TimeFilteredMapPoint) => item.condition === filters.condition);
    }

    if (filters.verified !== undefined) {
      items = items.filter((item: TimeFilteredMapPoint) => item.is_verified === filters.verified);
    }

    return {
      ok: true,
      items,
      message: `${items.length} pontos carregados.`
    };
  } catch (err) {
    console.error("[getTimeFilteredMapPoints] error:", err);
    return {
      ok: false,
      items: [],
      reason: "db-error",
      message: "Falha ao carregar pontos filtrados."
    };
  }
}
