import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WebhookDestinationItem } from "./webhook-types";

export type ListWebhookDestinationsResult = {
    ok: boolean;
    items: WebhookDestinationItem[];
    message?: string;
    reason?: "env-missing" | "unauthorized" | "rpc-missing" | "db-error";
};

export async function listWebhookDestinations(): Promise<ListWebhookDestinationsResult> {
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

        const { data, error } = await supabase.rpc("list_alert_destinations");

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
                    message: "RPC T13b (list_alert_webhook_destinations) não disponível."
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
                slug: row.slug,
                title: row.title,
                description: row.description,
                is_enabled: row.is_enabled,
                webhook_url: row.url_masked || row.webhook_url || "",
                secret_header_name: row.secret_header_name ?? null,
                secret_header_value: row.secret_header_value ?? null,
                signing_mode: row.signing_mode ?? null,
                signing_kid: row.signing_kid ?? null,
                signing_header_name: row.signing_header_name ?? null,
                event_filter: row.event_filter || {},
                destination_type: row.destination_type || "generic_webhook",
                destination_config: row.destination_config || {},
                created_at: row.created_at,
                updated_at: row.updated_at
            })) || []
        };
    } catch (err) {
        console.error("[listWebhookDestinations] Exception:", err);
        return {
            ok: false,
            items: [],
            reason: "db-error",
            message: err instanceof Error ? err.message : "Erro desconhecido."
        };
    }
}
