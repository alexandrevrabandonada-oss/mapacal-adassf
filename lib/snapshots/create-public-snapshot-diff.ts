import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CreatePublicSnapshotDiffResult = {
  ok: boolean;
  diffId: string | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "unauthorized";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function createPublicSnapshotDiff(
  fromSnapshotId: string,
  toSnapshotId: string,
  title?: string | null
): Promise<CreatePublicSnapshotDiffResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      diffId: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Diffs indisponiveis neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        diffId: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("create_public_snapshot_diff", {
      in_from_snapshot_id: fromSnapshotId,
      in_to_snapshot_id: toSnapshotId,
      in_title: title || null
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      if (error.code === "42501" || error.message?.includes("permission")) {
        return {
          ok: false,
          diffId: null,
          reason: "unauthorized",
          message: error.message || "Sem permissao para criar diffs"
        };
      }
      return {
        ok: false,
        diffId: null,
        reason,
        message: error.message || "Erro ao criar diff"
      };
    }

    if (!data || !data[0]) {
      return {
        ok: false,
        diffId: null,
        reason: "db-error",
        message: "RPC retornou dados vazios"
      };
    }

    const { ok: rpc_ok, message, diff_id } = data[0];

    if (!rpc_ok) {
      return {
        ok: false,
        diffId: null,
        reason: "db-error",
        message: message || "Erro ao criar diff"
      };
    }

    return {
      ok: true,
      diffId: diff_id
    };
  } catch (err) {
    console.error("[createPublicSnapshotDiff] Exception:", err);
    return {
      ok: false,
      diffId: null,
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
