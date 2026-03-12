import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AlertRunItem } from "./alert-types";

export type ListAlertRunsResult = {
    ok: boolean;
    items: AlertRunItem[];
    message?: string;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
};

export async function listAlertRuns(limit: number = 50): Promise<ListAlertRunsResult> {
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

        const { data, error } = await supabase.rpc("list_alert_runs", {
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
                    message: "RPC T13 (list_alert_runs) não disponível."
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
                started_at: row.started_at,
                finished_at: row.finished_at,
                status: row.status,
                message: row.message,
                alerts_created: row.alerts_created
            })) || []
        };
    } catch (err) {
        console.error("[listAlertRuns] Exception:", err);
        return {
            ok: false,
            items: [],
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido."
        };
    }
}
