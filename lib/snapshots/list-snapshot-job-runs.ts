import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SnapshotJobRunItem = {
  id: string;
  job_id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "skipped" | "error";
  message: string | null;
  snapshot_id: string | null;
};

export type ListSnapshotJobRunsResult = {
  ok: boolean;
  items: SnapshotJobRunItem[];
  message?: string;
  reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error" | "no-data";
};

function mapRpcErrorReason(code?: string): "unauthorized" | "rpc-missing" | "db-error" {
  if (code === "42501") {
    return "unauthorized";
  }
  if (code === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function listSnapshotJobRuns(limit: number = 50): Promise<ListSnapshotJobRunsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Historico de jobs indisponivel."
    };
  }

  const profile = await getCurrentProfile();
  if (!profile.isAuthenticated || !profile.canModerate) {
    return {
      ok: false,
      items: [],
      reason: "unauthorized",
      message: "Acesso restrito a moderator/admin."
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      items: [],
      reason: "env-missing",
      message: "Cliente Supabase indisponivel no servidor."
    };
  }

  const { data, error } = await supabase.rpc("list_snapshot_job_runs", {
    in_limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 50
  });

  if (error) {
    const reason = mapRpcErrorReason(error.code);
    return {
      ok: false,
      items: [],
      reason,
      message:
        reason === "rpc-missing"
          ? "RPC T12b nao disponivel. Aplique T12b_snapshot_automation.sql no Supabase."
          : reason === "unauthorized"
            ? "Sem permissao para listar historico."
            : "Falha ao listar runs de jobs."
    };
  }

  type RpcRow = SnapshotJobRunItem;
  const items = ((data as RpcRow[]) ?? []).map((row) => ({
    id: row.id,
    job_id: row.job_id,
    started_at: row.started_at,
    finished_at: row.finished_at,
    status: row.status,
    message: row.message,
    snapshot_id: row.snapshot_id
  }));

  if (items.length === 0) {
    return {
      ok: true,
      items: [],
      reason: "no-data",
      message: "Sem historico de execucoes."
    };
  }

  return {
    ok: true,
    items
  };
}
