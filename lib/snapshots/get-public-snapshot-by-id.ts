import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublicSnapshotData = {
  id: string;
  kind: "transparency" | "territory";
  title: string | null;
  days: number;
  neighborhood: string | null;
  snapshot_at: string;
  created_at: string;
  data: Record<string, unknown>;
};

export type GetPublicSnapshotByIdResult = {
  ok: boolean;
  snapshot: PublicSnapshotData | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "not-found";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function getPublicSnapshotById(
  snapshotId: string
): Promise<GetPublicSnapshotByIdResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      snapshot: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Snapshots indisponiveis neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        snapshot: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("get_public_snapshot_by_id", {
      in_snapshot_id: snapshotId
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        snapshot: null,
        reason,
        message: error.message || "Erro ao carregar snapshot"
      };
    }

    if (!data) {
      return {
        ok: false,
        snapshot: null,
        reason: "not-found",
        message: "Snapshot nao encontrado"
      };
    }

    // RPC retorna jsonb, já estruturado
    const snapshot = data as PublicSnapshotData;

    return {
      ok: true,
      snapshot
    };
  } catch (err) {
    console.error("[getPublicSnapshotById] Exception:", err);
    return {
      ok: false,
      snapshot: null,
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
