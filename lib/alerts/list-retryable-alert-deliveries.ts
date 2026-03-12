import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { RetryableDeliveryItem } from "./delivery-retry-types";

type ListRetryableResponse = {
    ok: boolean;
    message: string;
    reason?: string;
    items: RetryableDeliveryItem[];
};

export async function listRetryableAlertDeliveries(limit: number = 100): Promise<ListRetryableResponse> {
    const result: ListRetryableResponse = {
        ok: false,
        message: "",
        items: [],
    };

    if (!isSupabaseConfigured()) {
        result.reason = "env-missing";
        result.message = "Variáveis do Supabase não configuradas.";
        return result;
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
        result.reason = "env-missing";
        result.message = "Cliente Supabase admin não inicializado.";
        return result;
    }

    try {
        const { data, error } = await supabase.rpc("list_retryable_alert_deliveries", {
            in_limit: limit,
        });

        if (error) {
            if (error.code === "42883") {
                result.message = "A RPC list_retryable_alert_deliveries não foi encontrada. Aplique o script SQL apropriado.";
                result.reason = "rpc-missing";
                return result;
            }
            result.reason = "db-error";
            result.message = "Erro ao buscar entregas retentáveis: " + error.message;
            return result;
        }

        result.ok = true;
        result.items = (data || []) as unknown as RetryableDeliveryItem[];
        return result;
    } catch (err: any) {
        result.reason = "exception";
        result.message = "Exceção ao listar retentáveis: " + err.message;
        return result;
    }
}
