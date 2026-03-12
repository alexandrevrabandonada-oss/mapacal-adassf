import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AlertDeliveryRunItem } from "./webhook-types";

export type ListAlertDeliveryRunsResult = {
    ok: boolean;
    items: AlertDeliveryRunItem[];
    message?: string;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
};

export async function listAlertDeliveryRuns(limit: number = 50): Promise<ListAlertDeliveryRunsResult> {
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

        const { data, error } = await supabase.rpc("list_alert_delivery_runs", {
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
                    message: "RPC T13b (list_alert_delivery_runs) não disponível."
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
                deliveries_attempted: row.deliveries_attempted,
                deliveries_succeeded: row.deliveries_succeeded,
                deliveries_failed: row.deliveries_failed
            })) || []
        };
    } catch (err) {
        console.error("[listAlertDeliveryRuns] Exception:", err);
        return {
            ok: false,
            items: [],
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido."
        };
    }
}
