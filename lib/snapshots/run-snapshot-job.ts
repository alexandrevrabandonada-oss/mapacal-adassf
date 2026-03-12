import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAutoDiffForSnapshot } from "./create-auto-diff-for-snapshot";
import { AutoDiffStatus } from "./auto-diff-types";
import { evaluateAlertRules } from "@/lib/alerts/evaluate-alert-rules";

export type RunSnapshotJobResult = {
  ok: boolean;
  status: "success" | "skipped" | "error";
  snapshotId: string | null;
  message: string;
  reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
  autoDiffStatus?: AutoDiffStatus;
  diffId?: string | null;
  previousSnapshotId?: string | null;
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

export async function runSnapshotJob(jobId: string, options?: { asAdmin?: boolean }): Promise<RunSnapshotJobResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      status: "error",
      snapshotId: null,
      reason: "env-missing",
      message: "Supabase nao configurado."
    };
  }

  if (!options?.asAdmin) {
    const profile = await getCurrentProfile();
    if (!profile.isAuthenticated || !profile.canModerate) {
      return {
        ok: false,
        status: "error",
        snapshotId: null,
        reason: "unauthorized",
        message: "Acesso restrito a moderator/admin."
      };
    }
  }

  const supabase = options?.asAdmin ? getSupabaseAdminClient() : await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      status: "error",
      snapshotId: null,
      reason: "env-missing",
      message: "Cliente Supabase indisponivel no servidor."
    };
  }

  const { data, error } = await supabase.rpc("run_snapshot_job", {
    in_job_id: jobId
  });

  if (error) {
    const reason = mapRpcErrorReason(error.code);
    return {
      ok: false,
      status: "error",
      snapshotId: null,
      reason,
      message:
        reason === "rpc-missing"
          ? "RPC T12b nao disponivel. Aplique T12b_snapshot_automation.sql no Supabase."
          : reason === "unauthorized"
            ? "Sem permissao para executar job."
            : "Falha ao executar job de snapshot."
    };
  }

  type RpcRow = {
    ok: boolean;
    message: string;
    status: "success" | "skipped" | "error";
    snapshot_id: string | null;
  };

  const row = ((data as RpcRow[]) ?? [])[0];
  if (!row) {
    return {
      ok: false,
      status: "error",
      snapshotId: null,
      reason: "db-error",
      message: "Resposta vazia da execucao do job."
    };
  }

  let autoDiffStatus: AutoDiffStatus | undefined;
  let autoDiffId: string | null = null;
  let prevId: string | null = null;
  let finalMessage = row.message || "Execucao concluida";

  // If a snapshot was created, trigger auto-diff unconditionally as background job
  if (!!row.ok && row.snapshot_id && row.status === "success") {
    const diffRes = await createAutoDiffForSnapshot(row.snapshot_id, {
      source: "job",
      asAdmin: options?.asAdmin
    });

    autoDiffStatus = diffRes.status;
    autoDiffId = diffRes.diffId;
    prevId = diffRes.previousSnapshotId;

    if (diffRes.status === "error") {
      finalMessage += ` (Auto-diff error: ${diffRes.message})`;
    } else if (diffRes.status === "skipped") {
      finalMessage += ` (Auto-diff skipped: ${diffRes.message})`;
    } else {
      finalMessage += ` (Auto-diff success)`;
    }

    // T13: Auto-evaluate alerts after a successful snapshot and diff
    try {
      const alertRes = await evaluateAlertRules({
        source: "job",
        asAdmin: options?.asAdmin
      });
      if (alertRes.ok && alertRes.alertsCreated > 0) {
        finalMessage += ` [${alertRes.alertsCreated} Alertas Gerados]`;
      }
    } catch (e: any) {
      console.error("Failed to evaluate alerts after job execution", e);
    }
  }

  return {
    ok: !!row.ok,
    status: row.status,
    snapshotId: row.snapshot_id,
    message: finalMessage,
    autoDiffStatus,
    diffId: autoDiffId,
    previousSnapshotId: prevId
  };
}
