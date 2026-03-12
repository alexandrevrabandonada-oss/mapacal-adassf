import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type NearbyReport = Database["public"]["Functions"]["nearby_sidewalk_reports"]["Returns"][number];

export type FindNearbyResult = {
  ok: boolean;
  reports: NearbyReport[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "validation";
};

export async function findNearbyPublishedReports(lat: number, lng: number, meters = 25): Promise<FindNearbyResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      reports: [],
      reason: "validation",
      message: "Latitude/longitude invalidas para busca de proximidade."
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      reports: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Busca de proximidade desativada."
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: true,
      reports: [],
      reason: "env-missing",
      message: "Supabase indisponivel no servidor."
    };
  }

  const safeMeters = Number.isFinite(meters) ? Math.min(Math.max(Math.round(meters), 5), 250) : 25;

  const { data, error } = await supabase.rpc("nearby_sidewalk_reports", {
    in_lat: lat,
    in_lng: lng,
    in_meters: safeMeters
  });

  if (error) {
    const isRpcMissing = error.code === "42883" || error.message.toLowerCase().includes("nearby_sidewalk_reports");
    if (isRpcMissing) {
      return {
        ok: true,
        reports: [],
        reason: "rpc-missing",
        message: "RPC de dedupe ainda nao aplicada. Rode o SQL T03 no Supabase."
      };
    }

    return {
      ok: false,
      reports: [],
      reason: "db-error",
      message: "Falha ao buscar pontos proximos no banco."
    };
  }

  return {
    ok: true,
    reports: data ?? []
  };
}
