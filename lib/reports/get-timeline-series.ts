import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TimelineBucket = "day" | "week";

export type TimelineSeriesItem = {
  bucket_start: string;
  published_count: number;
  verified_count: number;
  blocked_count: number;
  bad_count: number;
  good_count: number;
  with_photo_count: number;
};

export type GetTimelineSeriesResult = {
  ok: boolean;
  items: TimelineSeriesItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "no-data";
};

function normalizeBucket(bucket: string | null | undefined): TimelineBucket {
  return bucket === "week" ? "week" : "day";
}

function mapRpcErrorReason(code?: string): "rpc-missing" | "db-error" {
  return code === "42883" ? "rpc-missing" : "db-error";
}

export async function getTimelineSeries(
  days: number = 90,
  bucket: string = "day",
  neighborhood?: string
): Promise<GetTimelineSeriesResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Timeline indisponivel neste ambiente."
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

  const { data, error } = await supabase.rpc("get_timeline_series", {
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
          : "Falha ao carregar serie temporal."
    };
  }

  type RpcRow = {
    bucket_start: string;
    published_count: number;
    verified_count: number;
    blocked_count: number;
    bad_count: number;
    good_count: number;
    with_photo_count: number;
  };

  const items = ((data as RpcRow[]) ?? []).map((row) => ({
    bucket_start: row.bucket_start,
    published_count: Number(row.published_count ?? 0),
    verified_count: Number(row.verified_count ?? 0),
    blocked_count: Number(row.blocked_count ?? 0),
    bad_count: Number(row.bad_count ?? 0),
    good_count: Number(row.good_count ?? 0),
    with_photo_count: Number(row.with_photo_count ?? 0)
  }));

  if (items.length === 0) {
    return {
      ok: true,
      items: [],
      reason: "no-data",
      message: "Sem dados publicados para o recorte escolhido."
    };
  }

  return {
    ok: true,
    items,
    message: "Serie temporal carregada com sucesso."
  };
}
