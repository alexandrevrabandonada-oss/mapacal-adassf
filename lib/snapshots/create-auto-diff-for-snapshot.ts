import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { AutoDiffResult } from "./auto-diff-types";

export async function createAutoDiffForSnapshot(
    snapshotId: string,
    options?: { source?: "manual" | "job" | "cron"; asAdmin?: boolean }
): Promise<AutoDiffResult> {
    const source = options?.source || "manual";

    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            status: "error",
            diffId: null,
            previousSnapshotId: null,
            reason: "env-missing",
            message: "Supabase não configurado. Diffs indisponíveis."
        };
    }

    try {
        const supabase = options?.asAdmin ? getSupabaseAdminClient() : await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                status: "error",
                diffId: null,
                previousSnapshotId: null,
                reason: "env-missing",
                message: "Cliente Supabase não disponível."
            };
        }

        const { data, error } = await supabase.rpc("create_auto_diff_for_snapshot", {
            in_snapshot_id: snapshotId,
            in_source: source
        });

        if (error) {
            if (error.code === "42883") {
                return {
                    ok: false,
                    status: "error",
                    diffId: null,
                    previousSnapshotId: null,
                    reason: "rpc-missing",
                    message: "RPC T12d não disponível. Aplique T12d_auto_diffs.sql."
                };
            }
            return {
                ok: false,
                status: "error",
                diffId: null,
                previousSnapshotId: null,
                reason: "db-error",
                message: error.message || "Erro ao criar auto diff."
            };
        }

        type RpcRow = {
            ok: boolean;
            message: string;
            status: string;
            previous_snapshot_id: string | null;
            diff_id: string | null;
        };

        const row = ((data as RpcRow[]) ?? [])[0];
        if (!row) {
            return {
                ok: false,
                status: "error",
                diffId: null,
                previousSnapshotId: null,
                reason: "db-error",
                message: "Resposta vazia da criação do diff."
            };
        }

        return {
            ok: !!row.ok,
            status: row.status as AutoDiffResult["status"],
            message: row.message || "",
            previousSnapshotId: row.previous_snapshot_id,
            diffId: row.diff_id
        };
    } catch (err) {
        console.error("[createAutoDiffForSnapshot] Exception:", err);
        return {
            ok: false,
            status: "error",
            diffId: null,
            previousSnapshotId: null,
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro interno no servidor."
        };
    }
}
