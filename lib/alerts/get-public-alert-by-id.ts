import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AlertEventItem } from "./alert-types";

export type GetAlertEventResult = {
    ok: boolean;
    alert?: AlertEventItem | null;
    message?: string;
    reason?: "env-missing" | "unauthorized" | "not-found" | "db-error";
};

export async function getPublicAlertById(id: string): Promise<GetAlertEventResult> {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            reason: "env-missing",
            message: "Supabase não configurado."
        };
    }

    try {
        const supabase = await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                reason: "env-missing",
                message: "Cliente Supabase não disponível."
            };
        }

        const { data, error } = await supabase
            .from("alert_events")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return {
                    ok: true,
                    alert: null,
                    message: "Alerta não encontrado."
                };
            }

            return {
                ok: false,
                reason: "db-error",
                message: error.message || "Erro de banco de dados."
            };
        }

        return {
            ok: true,
            alert: data as AlertEventItem
        };
    } catch (err) {
        console.error("[getPublicAlertById] Exception:", err);
        return {
            ok: false,
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido."
        };
    }
}
