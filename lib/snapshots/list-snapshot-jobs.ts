import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type SnapshotJobItem = {
  id: string;
  kind: "transparency" | "territory";
  frequency: "daily" | "weekly";
  days: number;
  neighborhood: string | null;
  is_enabled: boolean;
  last_run_at: string | null;
  last_snapshot_id: string | null;
};

export type ListSnapshotJobsResult = {
  ok: boolean;
  items: SnapshotJobItem[];
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

export async function listSnapshotJobs(options?: { asAdmin?: boolean }): Promise<ListSnapshotJobsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      items: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Jobs de snapshot indisponiveis."
    };
  }

  if (!options?.asAdmin) {
    const profile = await getCurrentProfile();
    if (!profile.isAuthenticated || !profile.canModerate) {
      return {
        ok: false,
        items: [],
        reason: "unauthorized",
        message: "Acesso restrito a moderator/admin."
      };
    }
  }

  const supabase = options?.asAdmin ? getSupabaseAdminClient() : await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      items: [],
      reason: "env-missing",
      message: "Cliente Supabase indisponivel no servidor."
    };
  }

  const { data, error } = await supabase.rpc("list_snapshot_jobs");

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
            ? "Sem permissao para listar jobs."
            : "Falha ao listar jobs de snapshot."
    };
  }

  type RpcRow = SnapshotJobItem;
  const items = ((data as RpcRow[]) ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    frequency: row.frequency,
    days: Number(row.days),
    neighborhood: row.neighborhood,
    is_enabled: !!row.is_enabled,
    last_run_at: row.last_run_at,
    last_snapshot_id: row.last_snapshot_id
  }));

  if (items.length === 0) {
    return {
      ok: true,
      items: [],
      reason: "no-data",
      message: "Nenhum job configurado."
    };
  }

  return {
    ok: true,
    items
  };
}
