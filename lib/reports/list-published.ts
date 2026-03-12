import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { isValidSidewalkCondition } from "@/lib/domain/sidewalk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type {
  GetPublishedReportByIdResult,
  ListPublishedReportsResult,
  PublicMapFilters,
  PublicMapReportItem
} from "./list-published-types";

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

function normalizeItem(
  item: Database["public"]["Functions"]["list_published_reports"]["Returns"][number]
): PublicMapReportItem | null {
  if (!isValidSidewalkCondition(item.condition)) {
    return null;
  }

  return {
    id: item.id,
    created_at: item.created_at,
    condition: item.condition,
    lat: item.lat,
    lng: item.lng,
    neighborhood: item.neighborhood,
    note: item.note,
    verification_count: item.verification_count,
    is_verified: item.is_verified
  };
}

export async function listPublishedReports(filters: PublicMapFilters = {}): Promise<ListPublishedReportsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. O mapa publico fica indisponivel neste ambiente."
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

  const { data, error } = await supabase.rpc("list_published_reports", {
    in_condition: filters.condition ?? null,
    in_neighborhood: filters.neighborhood?.trim() || null,
    in_verified_only: !!filters.verifiedOnly
  });

  if (error) {
    const reason = mapRpcErrorMessage(error.code);
    return {
      ok: reason !== "db-error",
      items: [],
      reason,
      message:
        reason === "rpc-missing"
          ? "SQL T04 nao aplicado ainda. Rode T04_public_map.sql no Supabase."
          : "Falha ao buscar lista publica."
    };
  }

  const normalized = (data ?? [])
    .map((row: Database["public"]["Functions"]["list_published_reports"]["Returns"][number]) => normalizeItem(row))
    .filter((row: PublicMapReportItem | null): row is PublicMapReportItem => row !== null);

  return {
    ok: true,
    items: normalized
  };
}

export async function getPublishedReportById(reportId: string): Promise<GetPublishedReportByIdResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      item: null,
      reason: "env-missing",
      message: "Supabase nao configurado."
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: true,
      item: null,
      reason: "env-missing",
      message: "Supabase indisponivel no servidor."
    };
  }

  const { data, error } = await supabase.rpc("get_published_report_by_id", {
    in_id: reportId
  });

  if (error) {
    const reason = mapRpcErrorMessage(error.code);
    return {
      ok: reason !== "db-error",
      item: null,
      reason,
      message:
        reason === "rpc-missing"
          ? "SQL T04 nao aplicado ainda. Rode T04_public_map.sql no Supabase."
          : "Falha ao buscar detalhe do ponto."
    };
  }

  const first = (data ?? [])[0];
  if (!first) {
    return {
      ok: true,
      item: null,
      reason: "not-found",
      message: "Registro nao encontrado ou ainda nao publicado."
    };
  }

  const normalized = normalizeItem(first);
  if (!normalized) {
    return {
      ok: true,
      item: null,
      reason: "not-found",
      message: "Registro indisponivel para exibicao publica."
    };
  }

  return {
    ok: true,
    item: normalized
  };
}
