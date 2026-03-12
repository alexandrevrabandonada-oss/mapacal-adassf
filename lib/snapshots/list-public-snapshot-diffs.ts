import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublicSnapshotDiffListItem = {
  id: string;
  kind: "transparency" | "territory";
  title: string | null;
  from_snapshot_id: string;
  to_snapshot_id: string;
  created_at: string;
};

export type ListPublicSnapshotDiffsResult = {
  ok: boolean;
  items: PublicSnapshotDiffListItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function listPublicSnapshotDiffs(
  kind?: "transparency" | "territory" | null,
  limit: number = 50
): Promise<ListPublicSnapshotDiffsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Diffs indisponiveis neste ambiente."
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

    const { data, error } = await supabase.rpc("list_public_snapshot_diffs", {
      in_kind: kind || null,
      in_limit: limit
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        items: [],
        reason,
        message: error.message || "Erro ao listar diffs"
      };
    }

    if (!Array.isArray(data)) {
      return {
        ok: true,
        items: [],
        message: "Nenhum diff encontrado"
      };
    }

    return {
      ok: true,
      items: data as PublicSnapshotDiffListItem[]
    };
  } catch (err) {
    console.error("[listPublicSnapshotDiffs] Exception:", err);
    return {
      ok: false,
      items: [],
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
