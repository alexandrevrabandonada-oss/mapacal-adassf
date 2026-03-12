import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { EvaluateAlertsResult, AlertSource } from "./alert-types";

export async function evaluateAlertRules(
    options?: { days?: number; baselineDays?: number; source?: AlertSource; asAdmin?: boolean }
): Promise<EvaluateAlertsResult> {
    const source = options?.source || "manual";
    const days = options?.days || 7;
    const baselineDays = options?.baselineDays || 30;

    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            message: "Supabase não configurado.",
            alertsCreated: 0,
            runId: null,
            reason: "env-missing"
        };
    }

    try {
        const supabase = options?.asAdmin ? getSupabaseAdminClient() : await getSupabaseServerClient();
        if (!supabase) {
            return {
                ok: false,
                message: "Cliente Supabase não disponível.",
                alertsCreated: 0,
                runId: null,
                reason: "env-missing"
            };
        }

        const { data, error } = await supabase.rpc("evaluate_alert_rules", {
            in_days: days,
            in_baseline_days: baselineDays,
            in_source: source
        });

        if (error) {
            if (error.code === "42883") {
                return {
                    ok: false,
                    message: "RPC T13 não disponível. Aplique T13_alerts.sql.",
                    alertsCreated: 0,
                    runId: null,
                    reason: "rpc-missing"
                };
            }
            return {
                ok: false,
                message: error.message || "Erro ao avaliar regras de alerta.",
                alertsCreated: 0,
                runId: null,
                reason: "db-error"
            };
        }

        type RpcRow = {
            ok: boolean;
            message: string;
            alerts_created: number;
            run_id: string | null;
        };

        const row = ((data as RpcRow[]) ?? [])[0];
        if (!row) {
            return {
                ok: false,
                message: "Resposta vazia da avaliação de alertas.",
                alertsCreated: 0,
                runId: null,
                reason: "db-error"
            };
        }

        return {
            ok: !!row.ok,
            message: row.message || "",
            alertsCreated: row.alerts_created || 0,
            runId: row.run_id
        };
    } catch (err) {
        console.error("[evaluateAlertRules] Exception:", err);
        return {
            ok: false,
            message: err instanceof Error ? err.message : "Erro interno no servidor.",
            alertsCreated: 0,
            runId: null,
            reason: "db-error"
        };
    }
}
