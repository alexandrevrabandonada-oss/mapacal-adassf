import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AlertEventItem, AlertStatus } from "./alert-types";

export type ListAlertEventsResult = {
    ok: boolean;
    items: AlertEventItem[];
    message?: string;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
};

export async function listAlertEvents(
    status?: AlertStatus | null,
    limit: number = 50
): Promise<ListAlertEventsResult> {
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

        const { data, error } = await supabase.rpc("list_alert_events", {
            in_status: status || null,
            in_limit: limit
        });

        if (error) {
            if (error.code === "42501" || error.message?.includes("Acesso negado") || error.message?.includes("Apenas admin")) {
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
                    message: "RPC T13 (list_alert_events) não disponível."
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
                severity: row.severity,
                scope: row.scope,
                neighborhood: row.neighborhood,
                condition: row.condition,
                title: row.title,
                summary: row.summary,
                status: row.status,
                created_at: row.created_at,
                source_snapshot_id: row.source_snapshot_id,
                source_diff_id: row.source_diff_id
            })) || []
        };
    } catch (err) {
        console.error("[listAlertEvents] Exception:", err);
        return {
            ok: false,
            items: [],
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido."
        };
    }
}
