import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublicSnapshotListItem = {
  id: string;
  kind: "transparency" | "territory";
  title: string | null;
  days: number;
  neighborhood: string | null;
  snapshot_at: string;
  created_at: string;
};

export type ListPublicSnapshotsResult = {
  ok: boolean;
  items: PublicSnapshotListItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function listPublicSnapshots(
  kind?: "transparency" | "territory" | null,
  limit: number = 50
): Promise<ListPublicSnapshotsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Snapshots indisponiveis neste ambiente."
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

    const { data, error } = await supabase.rpc("list_public_snapshots", {
      in_kind: kind || null,
      in_limit: limit
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        items: [],
        reason,
        message: error.message || "Erro ao listar snapshots"
      };
    }

    if (!Array.isArray(data)) {
      return {
        ok: true,
        items: [],
        message: "Nenhum snapshot encontrado"
      };
    }

    return {
      ok: true,
      items: data as PublicSnapshotListItem[]
    };
  } catch (err) {
    console.error("[listPublicSnapshots] Exception:", err);
    return {
      ok: false,
      items: [],
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
