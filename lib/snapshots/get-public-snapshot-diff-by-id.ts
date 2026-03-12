import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublicSnapshotDiffData = {
  id: string;
  kind: "transparency" | "territory";
  title: string | null;
  from_snapshot_id: string;
  to_snapshot_id: string;
  created_at: string;
  diff_data: Record<string, unknown>;
};

export type GetPublicSnapshotDiffByIdResult = {
  ok: boolean;
  diff: PublicSnapshotDiffData | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "not-found";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function getPublicSnapshotDiffById(
  diffId: string
): Promise<GetPublicSnapshotDiffByIdResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      diff: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Diffs indisponiveis neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        diff: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("get_public_snapshot_diff_by_id", {
      in_diff_id: diffId
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        diff: null,
        reason,
        message: error.message || "Erro ao carregar diff"
      };
    }

    if (!data) {
      return {
        ok: false,
        diff: null,
        reason: "not-found",
        message: "Diff nao encontrado"
      };
    }

    // RPC retorna jsonb, já estruturado
    const diff = data as PublicSnapshotDiffData;

    return {
      ok: true,
      diff
    };
  } catch (err) {
    console.error("[getPublicSnapshotDiffById] Exception:", err);
    return {
      ok: false,
      diff: null,
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
