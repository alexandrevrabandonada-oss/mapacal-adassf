import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TimelineConditionSeriesItem = {
  bucket_start: string;
  condition: string;
  count: number;
  verified_count: number;
};

export type GetTimelineConditionSeriesResult = {
  ok: boolean;
  items: TimelineConditionSeriesItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "no-data";
};

function normalizeBucket(bucket: string | null | undefined): "day" | "week" {
  return bucket === "day" ? "day" : "week";
}

function mapRpcErrorReason(code?: string): "rpc-missing" | "db-error" {
  return code === "42883" ? "rpc-missing" : "db-error";
}

export async function getTimelineConditionSeries(
  days: number = 90,
  bucket: string = "week",
  neighborhood?: string
): Promise<GetTimelineConditionSeriesResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Serie por condicao indisponivel."
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
  const safeBucket = normalizeBucket(bucket);

  const { data, error } = await supabase.rpc("get_timeline_condition_series", {
    in_days: safeDays,
    in_bucket: safeBucket,
    in_neighborhood: neighborhood || null
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
          : "Falha ao carregar serie temporal por condicao."
    };
  }

  type RpcRow = {
    bucket_start: string;
    condition: string;
    count: number;
    verified_count: number;
  };

  const items = ((data as RpcRow[]) ?? []).map((row) => ({
    bucket_start: row.bucket_start,
    condition: row.condition,
    count: Number(row.count ?? 0),
    verified_count: Number(row.verified_count ?? 0)
  }));

  if (items.length === 0) {
    return {
      ok: true,
      items: [],
      reason: "no-data",
      message: "Sem dados por condicao para o recorte escolhido."
    };
  }

  return {
    ok: true,
    items,
    message: "Serie por condicao carregada com sucesso."
  };
}
