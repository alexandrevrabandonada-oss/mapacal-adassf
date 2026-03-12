import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SnapshotDiffRunItem } from "./auto-diff-types";

export type ListSnapshotDiffRunsResult = {
    ok: boolean;
    items: SnapshotDiffRunItem[];
    message?: string;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
};

export async function listSnapshotDiffRuns(limit: number = 50): Promise<ListSnapshotDiffRunsResult> {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            items: [],
            reason: "env-missing",
            message: "Supabase não configurado."
        };
    }

    try {
        const supabase = await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                items: [],
                reason: "env-missing",
                message: "Cliente Supabase não disponível."
            };
        }

        const { data, error } = await supabase.rpc("list_snapshot_diff_runs", {
            in_limit: limit
        });

        if (error) {
            if (error.code === "42501" || error.message?.includes("Acesso negado")) {
                return {
                    ok: false,
                    items: [],
                    reason: "unauthorized",
                    message: error.message || "Acesso negado."
                };
            }
            if (error.code === "42883") {
                return {
                    ok: false,
                    items: [],
                    reason: "rpc-missing",
                    message: "RPC T12d (list_snapshot_diff_runs) não disponível."
                };
            }
            return {
                ok: false,
                items: [],
                reason: "db-error",
                message: error.message || "Erro de banco de dados."
            };
        }

        return {
            ok: true,
            items: (data as any[])?.map(row => ({
                id: row.id,
                source: row.source,
                snapshot_id: row.snapshot_id,
                previous_snapshot_id: row.previous_snapshot_id,
                diff_id: row.diff_id,
                started_at: row.started_at,
                finished_at: row.finished_at,
                status: row.status,
                message: row.message
            })) || []
        };
    } catch (err) {
        console.error("[listSnapshotDiffRuns] Exception:", err);
        return {
            ok: false,
            items: [],
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido."
        };
    }
}
