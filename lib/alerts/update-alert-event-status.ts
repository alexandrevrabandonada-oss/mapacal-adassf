import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AlertStatus } from "./alert-types";

export type UpdateAlertEventStatusResult = {
    ok: boolean;
    message: string;
    status?: AlertStatus;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
};

export async function updateAlertEventStatus(
    alertId: string,
    status: AlertStatus
): Promise<UpdateAlertEventStatusResult> {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            message: "Supabase não configurado.",
            reason: "env-missing"
        };
    }

    try {
        const supabase = await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                message: "Cliente Supabase não disponível.",
                reason: "env-missing"
            };
        }

        const { data, error } = await supabase.rpc("update_alert_event_status", {
            in_alert_id: alertId,
            in_status: status
        });

        if (error) {
            if (error.code === "42501" || error.message?.includes("Acesso negado")) {
                return {
                    ok: false,
                    message: error.message || "Acesso negado.",
                    reason: "unauthorized"
                };
            }
            if (error.code === "42883") {
                return {
                    ok: false,
                    message: "RPC T13 (update_alert_event_status) não disponível.",
                    reason: "rpc-missing"
                };
            }
            return {
                ok: false,
                message: error.message || "Erro de banco de dados.",
                reason: "db-error"
            };
        }

        type RpcRow = {
            ok: boolean;
            message: string;
            status: string;
        };

        const row = ((data as RpcRow[]) ?? [])[0];
        if (!row) {
            return {
                ok: false,
                message: "Resposta vazia da atualização de status.",
                reason: "db-error"
            };
        }

        return {
            ok: !!row.ok,
            message: row.message || "",
            status: row.status as AlertStatus
        };
    } catch (err) {
        console.error("[updateAlertEventStatus] Exception:", err);
        return {
            ok: false,
            message: err instanceof Error ? err.message : "Erro desconhecido.",
            reason: "db-error"
        };
    }
}
