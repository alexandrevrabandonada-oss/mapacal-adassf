import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createAutoDiffForSnapshot } from "./create-auto-diff-for-snapshot";
import { AutoDiffStatus } from "./auto-diff-types";

export type CreatePublicSnapshotResult = {
  ok: boolean;
  snapshotId: string | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "unauthorized";
  autoDiffStatus?: AutoDiffStatus;
  diffId?: string | null;
  previousSnapshotId?: string | null;
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function createPublicSnapshot(
  kind: "transparency" | "territory",
  days: number = 30,
  neighborhood?: string | null,
  title?: string | null,
  options?: { autoDiff?: boolean; source?: "manual" | "job" | "cron"; asAdmin?: boolean }
): Promise<CreatePublicSnapshotResult> {
  const doAutoDiff = options?.autoDiff !== false;
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      snapshotId: null,
      reason: "env-missing",
      message: "Supabase nao configurado. Snapshots indisponiveis neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        snapshotId: null,
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("create_public_snapshot", {
      in_kind: kind,
      in_days: days,
      in_neighborhood: neighborhood || null,
      in_title: title || null
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      if (error.code === "42501" || error.message?.includes("permission")) {
        return {
          ok: false,
          snapshotId: null,
          reason: "unauthorized",
          message: error.message || "Sem permissao para criar snapshots"
        };
      }
      return {
        ok: false,
        snapshotId: null,
        reason,
        message: error.message || "Erro ao criar snapshot"
      };
    }

    if (!data || !data[0]) {
      return {
        ok: false,
        snapshotId: null,
        reason: "db-error",
        message: "RPC retornou dados vazios"
      };
    }

    const { ok: rpk_ok, message, snapshot_id } = data[0];

    if (!rpk_ok) {
      return {
        ok: false,
        snapshotId: null,
        reason: "db-error",
        message: message || "Erro ao criar snapshot"
      };
    }

    let autoDiffStatus: AutoDiffStatus | undefined;
    let autoDiffId: string | null = null;
    let prevId: string | null = null;
    let appendedMessage = "";

    if (doAutoDiff) {
      const diffRes = await createAutoDiffForSnapshot(snapshot_id, {
        source: options?.source || "manual",
        asAdmin: options?.asAdmin
      });
      autoDiffStatus = diffRes.status;
      autoDiffId = diffRes.diffId;
      prevId = diffRes.previousSnapshotId;

      if (diffRes.status === "error") {
        appendedMessage = ` (Aviso: Falha ao gerar auto-diff: ${diffRes.message})`;
      } else if (diffRes.status === "skipped") {
        appendedMessage = ` (Auto-diff ignorado: ${diffRes.message})`;
      } else {
        appendedMessage = ` (Auto-diff gerado com sucesso)`;
      }
    }

    return {
      ok: true,
      snapshotId: snapshot_id,
      message: "Snapshot criado" + appendedMessage,
      autoDiffStatus,
      diffId: autoDiffId,
      previousSnapshotId: prevId
    };
  } catch (err) {
    console.error("[createPublicSnapshot] Exception:", err);
    return {
      ok: false,
      snapshotId: null,
      reason: "db-error",
      message: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}
