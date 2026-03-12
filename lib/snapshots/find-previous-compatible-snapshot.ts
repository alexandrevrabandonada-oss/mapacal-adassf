import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { PreviousCompatibleSnapshot } from "./auto-diff-types";

export type FindPreviousCompatibleSnapshotResult = {
    ok: boolean;
    snapshot: PreviousCompatibleSnapshot | null;
    message?: string;
    reason?: "env-missing" | "rpc-missing" | "db-error";
};

export async function findPreviousCompatibleSnapshot(
    snapshotId: string,
    options?: { asAdmin?: boolean }
): Promise<FindPreviousCompatibleSnapshotResult> {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            snapshot: null,
            reason: "env-missing",
            message: "Supabase não configurado."
        };
    }

    try {
        const supabase = options?.asAdmin ? getSupabaseAdminClient() : await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                snapshot: null,
                reason: "env-missing",
                message: "Cliente Supabase não disponível no servidor."
            };
        }

        const { data, error } = await supabase.rpc("find_previous_compatible_snapshot", {
            in_snapshot_id: snapshotId
        });

        if (error) {
            if (error.code === "42883") {
                return {
                    ok: false,
                    snapshot: null,
                    reason: "rpc-missing",
                    message: "RPC T12d não disponível. Aplique T12d_auto_diffs.sql."
                };
            }
            return {
                ok: false,
                snapshot: null,
                reason: "db-error",
                message: error.message || "Erro ao buscar snapshot anterior"
            };
        }

        const row = data?.[0];
        if (!row) {
            return {
                ok: true,
                snapshot: null,
                message: "Nenhum snapshot anterior compatível encontrado."
            };
        }

        return {
            ok: true,
            snapshot: {
                snapshot_id: row.snapshot_id,
                kind: row.kind,
                days: row.days,
                neighborhood: row.neighborhood,
                snapshot_at: row.snapshot_at
            }
        };
    } catch (err) {
        console.error("[findPreviousCompatibleSnapshot] Exception:", err);
        return {
            ok: false,
            snapshot: null,
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido"
        };
    }
}
