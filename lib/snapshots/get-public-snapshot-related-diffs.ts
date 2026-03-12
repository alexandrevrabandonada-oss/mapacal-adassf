import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PublicSnapshotDiffListItem } from "./list-public-snapshot-diffs";

export type GetPublicSnapshotRelatedDiffsResult = {
    ok: boolean;
    nextDiffs: PublicSnapshotDiffListItem[];
    prevDiffs: PublicSnapshotDiffListItem[];
    message?: string;
    reason?: "env-missing" | "rpc-missing" | "db-error";
};

export async function getPublicSnapshotRelatedDiffs(snapshotId: string): Promise<GetPublicSnapshotRelatedDiffsResult> {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            nextDiffs: [],
            prevDiffs: [],
            reason: "env-missing",
            message: "Supabase não configurado."
        };
    }

    try {
        const supabase = await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                nextDiffs: [],
                prevDiffs: [],
                reason: "env-missing",
                message: "Cliente Supabase não disponível."
            };
        }

        // Busca diffs onde este snapshot é o "anterior" (from) -> logo são diffs "posteriores"
        const nextQuery = await supabase
            .from("public_snapshot_diffs")
            .select("id, kind, from_snapshot_id, to_snapshot_id, title, created_at")
            .eq("from_snapshot_id", snapshotId)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

        // Busca diffs onde este snapshot é o "atual" (to) -> logo são diffs "anteriores"
        const prevQuery = await supabase
            .from("public_snapshot_diffs")
            .select("id, kind, from_snapshot_id, to_snapshot_id, title, created_at")
            .eq("to_snapshot_id", snapshotId)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

        return {
            ok: true,
            nextDiffs: nextQuery.data || [],
            prevDiffs: prevQuery.data || []
        };
    } catch (err) {
        console.error("[getPublicSnapshotRelatedDiffs] Exception:", err);
        return {
            ok: false,
            nextDiffs: [],
            prevDiffs: [],
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido"
        };
    }
}
