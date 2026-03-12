import "server-only";

import { isSupabaseConfigured, getAlertWebhookUserAgent } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DeliveryRetryMode, RedeliverResult, RetryableDeliveryItem } from "./delivery-retry-types";
import { listRetryableAlertDeliveries } from "./list-retryable-alert-deliveries";

type RedeliverOptions = {
    asAdmin?: boolean;
    dryRun?: boolean;
    deliveryId?: string;
};

export async function redeliverAlertWebhooks(
    mode: DeliveryRetryMode,
    options?: RedeliverOptions
): Promise<RedeliverResult> {
    const result: RedeliverResult = {
        ok: false,
        message: "",
        attempted: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        results: []
    };

    if (!isSupabaseConfigured()) {
        result.message = "Supabase não configurado.";
        return result;
    }

    if (!options?.asAdmin) {
        const profile = await getCurrentProfile();
        if (!profile.isAuthenticated || !profile.canModerate) {
            result.message = "Acesso negado. Apenas admins/moderadores podem disparar.";
            return result;
        }
    }

    const supabase = options?.asAdmin
        ? getSupabaseAdminClient()
        : await (await import("@/lib/supabase/server")).getSupabaseServerClient();

    if (!supabase) {
        result.message = "Cliente Supabase não inicializado.";
        return result;
    }

    // Obter lista de deliveries a re-processar
    let deliveriesToRetry: RetryableDeliveryItem[] = [];

    if (options?.deliveryId) {
        const { data, error } = await supabase.rpc("list_retryable_alert_deliveries", { in_limit: 1000 });
        if (error || !data) {
            result.message = "Erro ao buscar delivery específico: " + (error?.message || "Sem dados");
            return result;
        }
        const item = (data as unknown as RetryableDeliveryItem[]).find(d => d.id === options.deliveryId);
        if (item) {
            deliveriesToRetry = [item];
        } else {
            result.message = "Delivery não encontrado ou não elegível para retry.";
            return result;
        }
    } else {
        const listRes = await listRetryableAlertDeliveries(100);
        if (!listRes.ok) {
            result.message = listRes.message;
            return result;
        }
        deliveriesToRetry = listRes.items;
    }

    if (deliveriesToRetry.length === 0) {
        result.ok = true;
        result.message = "Nenhum alerta pendente de re-entrega.";
        return result;
    }

    const userAgent = getAlertWebhookUserAgent();

    for (const delivery of deliveriesToRetry) {
        result.attempted++;

        if (options?.dryRun) {
            result.succeeded++;
            result.results.push({
                deliveryId: delivery.id,
                finalStatus: "success",
                message: "Dry Run OK"
            });
            continue;
        }

        // Buscar raw alert
        const { data: alertData } = await supabase.from("alert_events").select("*").eq("id", delivery.alert_id).single();
        if (!alertData) {
            result.failed++;
            continue;
        }

        const payload = {
            event: "alert.retry",
            alert: {
                id: alertData.id,
                severity: alertData.severity,
                scope: alertData.scope,
                neighborhood: alertData.neighborhood,
                condition: alertData.condition,
                title: alertData.title,
                summary: alertData.summary,
                status: alertData.status,
                createdAt: alertData.created_at,
                sourceSnapshotId: alertData.source_snapshot_id,
                sourceDiffId: alertData.source_diff_id
            },
            context: {
                app: "mapa-calcadas-sf",
                sentAt: new Date().toISOString(),
                retryAttempt: delivery.attempt_number + 1
            }
        };

        // Buscar webhook dest completo (pra pegar headers seguros)
        const { data: destData } = await supabase.from("alert_webhook_destinations").select("*").eq("id", delivery.destination_id).single();
        if (!destData) {
            result.failed++;
            continue;
        }

        try {
            const rawPayload = JSON.stringify(payload);

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                "User-Agent": userAgent
            };

            if (destData.secret_header_name && destData.secret_header_value) {
                (headers as Record<string, string>)[destData.secret_header_name] = destData.secret_header_value;
            }

            if (destData.signing_mode === 'hmac_sha256' && destData.signing_secret) {
                const { buildSignatureHeaders } = await import("@/lib/alerts/webhook-signing");
                const sigHeaders = buildSignatureHeaders(
                    destData.signing_secret,
                    rawPayload,
                    destData.signing_header_name || "x-webhook-signature",
                    destData.signing_timestamp_header_name || "x-webhook-timestamp",
                    destData.signing_kid
                );
                Object.assign(headers, sigHeaders);
            }

            const fetchReq = await fetch(delivery.webhook_url, {
                method: "POST",
                headers,
                body: rawPayload
            });

            const respStatus = fetchReq.status;
            let respExcerpt = "OK";
            if (!fetchReq.ok) {
                try {
                    const text = await fetchReq.text();
                    respExcerpt = text.substring(0, 500);
                } catch {
                    respExcerpt = "No response body / unreadable";
                }
            }

            if (fetchReq.ok) {
                result.succeeded++;
                const rpcRes = await supabase.rpc("mark_alert_delivery_retry_result", {
                    in_delivery_id: delivery.id,
                    in_status: "success",
                    in_response_status: respStatus,
                    in_response_excerpt: respExcerpt
                });

                result.results.push({
                    deliveryId: delivery.id,
                    finalStatus: "success",
                    message: `Success: ${respStatus}`
                });

            } else {
                result.failed++;
                const isPermanent = respStatus >= 400 && respStatus < 500 && respStatus !== 429;
                const errorCode = isPermanent ? 'PERMANENT_FAIL' : 'TEMP_FAIL';

                const { data: rpcData } = await supabase.rpc("mark_alert_delivery_retry_result", {
                    in_delivery_id: delivery.id,
                    in_status: "failed",
                    in_response_status: respStatus,
                    in_response_excerpt: respExcerpt,
                    in_error_code: errorCode
                });

                const returnedStatus = (rpcData && rpcData.length > 0) ? rpcData[0].final_status : "failed_retryable";

                result.results.push({
                    deliveryId: delivery.id,
                    finalStatus: returnedStatus as any,
                    message: `Failed: ${respStatus} - ${errorCode}`
                });
            }
        } catch (e: any) {
            result.failed++;
            const { data: rpcData } = await supabase.rpc("mark_alert_delivery_retry_result", {
                in_delivery_id: delivery.id,
                in_status: "failed",
                in_response_status: 0,
                in_response_excerpt: e?.message?.substring(0, 300) || "Erro brusco de Network",
                in_error_code: 'TEMP_FAIL'
            });
            const returnedStatus = (rpcData && rpcData.length > 0) ? rpcData[0].final_status : "failed_retryable";

            result.results.push({
                deliveryId: delivery.id,
                finalStatus: returnedStatus as any,
                message: `Network Error: ${e?.message}`
            });
        }
    }

    result.ok = true;
    result.message = `Re-entrega finalizada. Sucesso: ${result.succeeded}, Falha: ${result.failed}`;
    return result;
}
