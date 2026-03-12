import "server-only";

import { isSupabaseConfigured, getAlertWebhookUserAgent, getAppBaseUrl } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DeliverAlertsMode, DeliverAlertsResult } from "./webhook-types";
import { buildSignatureHeaders } from "./webhook-signing";
import { listWebhookDestinations } from "./list-webhook-destinations";
import { listOpenAlertEventsForDelivery } from "./list-open-alert-events-for-delivery";
import { 
    isDiscordConfig, 
    isSlackConfig, 
    isTelegramConfig 
} from "./native-destination-types";
import { buildDiscordAlertPayload } from "./build-discord-alert-payload";
import { buildSlackAlertPayload } from "./build-slack-alert-payload";
import { buildTelegramAlertPayload } from "./build-telegram-alert-payload";
import { OpenAlertForDelivery } from "./webhook-types";
import { fetchAlertRepresentativePhoto } from "./fetch-alert-representative-photo";
import { getStorageBucket } from "@/lib/env";

// Helper genérico para compilar a URL pública se houver
function buildPublicUrl(alert: OpenAlertForDelivery): string | undefined {
    const baseUrl = getAppBaseUrl();
    if (!baseUrl) return undefined;
    
    // Fallback pra tela original caso source links falhem
    const url = `${baseUrl}/alertas/${alert.id}`;
    return url;
}

export async function deliverAlertsToDestinations(
    mode: DeliverAlertsMode,
    options?: { asAdmin?: boolean; dryRun?: boolean }
): Promise<DeliverAlertsResult> {
    const result: DeliverAlertsResult = {
        ok: false,
        message: "",
        attempted: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        runId: null
    };

    if (!isSupabaseConfigured()) {
        result.reason = "env-missing";
        result.message = "Supabase não configurado.";
        return result;
    }

    // Auth check se não for asAdmin
    if (!options?.asAdmin) {
        const profile = await getCurrentProfile();
        if (!profile.isAuthenticated || !profile.canModerate) {
            result.reason = "unauthorized";
            result.message = "Acesso negado. Apenas admins/moderadores podem disparar.";
            return result;
        }
    }

    const supabase = options?.asAdmin ? getSupabaseAdminClient() : await (await import("@/lib/supabase/server")).getSupabaseServerClient();
    if (!supabase) {
        result.reason = "env-missing";
        result.message = "Cliente Supabase não inicializado.";
        return result;
    }

    // 1. Listar Destinos
    const destResponse = await listWebhookDestinations();
    if (!destResponse.ok) {
        result.reason = destResponse.reason;
        result.message = "Falha ao listar destinos: " + destResponse.message;
        return result;
    }

    const activeDestinations = destResponse.items.filter(d => d.is_enabled);
    if (activeDestinations.length === 0) {
        result.reason = "no-destinations";
        result.message = "Nenhum destino habilitado.";
        return result;
    }

    // 2. Listar Alertas Abertos
    const alertsResponse = await listOpenAlertEventsForDelivery(100);
    if (!alertsResponse.ok) {
        result.reason = alertsResponse.reason;
        result.message = "Falha ao listar alertas: " + alertsResponse.message;
        return result;
    }

    if (alertsResponse.items.length === 0) {
        result.reason = "no-alerts";
        result.message = "Nenhum alerta pendente.";
        result.ok = true;
        return result;
    }

    const runStats = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
    let runId: string | null = null;

    if (!options?.dryRun) {
        const { data: runData, error: runError } = await supabase
            .from("alert_delivery_runs")
            .insert({ source: mode, status: "running" })
            .select("id")
            .single();

        if (runError || !runData) {
            result.reason = "db-error";
            result.message = "Falha ao criar Delivery Run: " + runError?.message;
            return result;
        }
        runId = runData.id;
        result.runId = runData.id;
    }

    const userAgent = getAlertWebhookUserAgent();

    for (const alert of alertsResponse.items) {
        const publicUrl = buildPublicUrl(alert);

        // T15b: Buscar foto representativa para o alerta
        let photoUrl: string | undefined;
        const photoInfo = await fetchAlertRepresentativePhoto(
            supabase,
            alert.scope,
            alert.neighborhood,
            alert.condition
        );

        if (photoInfo) {
            if (photoInfo.isPrivate) {
                // Gerar Signed URL para foto privada
                try {
                    const bucket = getStorageBucket();
                    const { data: signedData, error: signedError } = await supabase
                        .storage
                        .from(bucket)
                        .createSignedUrl(photoInfo.path, 60 * 60 * 24); // 24h

                    if (!signedError && signedData) {
                        photoUrl = signedData.signedUrl;
                    }
                } catch (err) {
                    console.error("[deliverAlertsToDestinations] SignedURL error:", err);
                }
            } else {
                // URL pública (assumindo que photo_public_path já é uma URL ou path relativo acessível)
                // Se for path relativo do bucket público:
                const bucket = getStorageBucket();
                const { data: publicData } = supabase
                    .storage
                    .from(bucket)
                    .getPublicUrl(photoInfo.path);
                
                photoUrl = publicData.publicUrl;
            }
        }

        for (const dest of activeDestinations) {
            // 4a. Verificar filtro (Scope / Severity)
            const severityFilter = dest.event_filter?.severities as string[] | undefined;
            if (severityFilter && severityFilter.length > 0 && !severityFilter.includes(alert.severity)) {
                runStats.skipped++;
                continue;
            }

            const scopeFilter = dest.event_filter?.scopes as string[] | undefined;
            if (scopeFilter && scopeFilter.length > 0 && !scopeFilter.includes(alert.scope)) {
                runStats.skipped++;
                continue;
            }

            // Dedupe and Execution
            runStats.attempted++;

            if (options?.dryRun) {
                runStats.succeeded++;
            } else {
                let deliveryIdGenerated: string | null = null;
                try {
                    // Pre-inserir a delivery log com pending
                    const { data: deliveryData, error: deliveryError } = await supabase
                        .from("alert_deliveries")
                        .insert({
                            alert_id: alert.id,
                            destination_id: dest.id,
                            run_id: runId,
                            status: "pending",
                            dedupe_key: `${alert.id}_${dest.id}`,
                            attempt_number: 1
                        })
                        .select("id")
                        .single();

                    if (deliveryError) {
                        if (deliveryError.code === "23505") { // unique constraint violation = deduped
                            runStats.skipped++;
                            runStats.attempted--;
                            continue;
                        }
                        runStats.failed++;
                        continue;
                    }

                    const deliveryId = deliveryData.id;
                    deliveryIdGenerated = deliveryId;

                    let targetUrl = dest.webhook_url;
                    const headers: HeadersInit = {
                        "Content-Type": "application/json",
                        "User-Agent": userAgent
                    };
                    let rawPayload = "";

                    // Seleciona Payload baseado no Destination Type
                    if (dest.destination_type === "slack_webhook" && isSlackConfig(dest.destination_type, dest.destination_config)) {
                        const payloadObj = buildSlackAlertPayload(alert as any, dest.destination_config, publicUrl, photoUrl);
                        rawPayload = JSON.stringify(payloadObj);
                    } else if (dest.destination_type === "discord_webhook" && isDiscordConfig(dest.destination_type, dest.destination_config)) {
                        const payloadObj = buildDiscordAlertPayload(alert as any, dest.destination_config, publicUrl, photoUrl);
                        rawPayload = JSON.stringify(payloadObj);
                    } else if (dest.destination_type === "telegram_bot" && isTelegramConfig(dest.destination_type, dest.destination_config)) {
                        const payloadObj = buildTelegramAlertPayload(alert as any, dest.destination_config, publicUrl, photoUrl);
                        if (!payloadObj) {
                            throw new Error("Missing chat_id or botToken for Telegram");
                        }
                        
                        const method = payloadObj.photo ? "sendPhoto" : "sendMessage";
                        targetUrl = `https://api.telegram.org/bot${dest.destination_config.botToken}/${method}`;
                        rawPayload = JSON.stringify(payloadObj);
                    } else {
                        // generic_webhook
                        const payloadObj = {
                            event: "alert.open",
                            alert: {
                                id: alert.id,
                                severity: alert.severity,
                                scope: alert.scope,
                                neighborhood: alert.neighborhood,
                                condition: alert.condition,
                                title: alert.title,
                                summary: alert.summary,
                                status: alert.status,
                                createdAt: alert.created_at,
                                sourceSnapshotId: alert.source_snapshot_id,
                                sourceDiffId: alert.source_diff_id
                            },
                            context: {
                                app: "mapa-calcadas-sf",
                                sentAt: new Date().toISOString(),
                                publicUrl
                            }
                        };
                        rawPayload = JSON.stringify(payloadObj);

                        // Header Legacy (Custom API Keys) só faz sentido em Webhooks Genéricos
                        if (dest.secret_header_name && dest.secret_header_value) {
                            (headers as Record<string, string>)[dest.secret_header_name] = dest.secret_header_value;
                        }

                        // HMAC (T13d) só faz sentido em Webhooks Genéricos
                        if (dest.signing_mode === 'hmac_sha256' && dest.signing_secret) {
                            const sigHeaders = buildSignatureHeaders(
                                dest.signing_secret,
                                rawPayload,
                                dest.signing_header_name || "x-webhook-signature",
                                dest.signing_timestamp_header_name || "x-webhook-timestamp",
                                dest.signing_kid
                            );
                            Object.assign(headers, sigHeaders);
                        }
                    }

                    // Disparar requisição nativa HTTP POST
                    const fetchReq = await fetch(targetUrl, {
                        method: "POST",
                        headers,
                        body: rawPayload
                    });

                    // Computar Resultado
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
                        runStats.succeeded++;
                        await supabase.from("alert_deliveries").update({
                            status: "success",
                            final_status: "success",
                            response_status: respStatus,
                            response_excerpt: respExcerpt
                        }).eq("id", deliveryId);
                    } else {
                        runStats.failed++;
                        const isPermanent = respStatus >= 400 && respStatus < 500 && respStatus !== 429;
                        const errorCode = isPermanent ? 'PERMANENT_FAIL' : 'TEMP_FAIL';

                        await supabase.rpc("mark_alert_delivery_retry_result", {
                            in_delivery_id: deliveryId,
                            in_status: "failed",
                            in_response_status: respStatus,
                            in_response_excerpt: respExcerpt,
                            in_error_code: errorCode
                        });
                    }

                } catch (e: unknown) {
                    runStats.failed++;
                    const message = e instanceof Error ? e.message.substring(0, 300) : "Erro de Network brusco";
                    
                    if (deliveryIdGenerated) {
                        await supabase.rpc("mark_alert_delivery_retry_result", {
                            in_delivery_id: deliveryIdGenerated,
                            in_status: "failed",
                            in_response_status: 0,
                            in_response_excerpt: message,
                            in_error_code: 'TEMP_FAIL'
                        });
                    }
                }
            }
        }
    }

    // 5. Finalizar a Run se não for dry
    if (!options?.dryRun && runId) {
        const finalStatus = runStats.failed > 0
            ? (runStats.succeeded > 0 ? "partial" : "error")
            : "success";

        await supabase.from("alert_delivery_runs").update({
            finished_at: new Date().toISOString(),
            status: finalStatus,
            message: `Enviados ${runStats.succeeded}/${runStats.attempted} (falharam: ${runStats.failed}, pulados/dedup: ${runStats.skipped})`,
            deliveries_attempted: runStats.attempted,
            deliveries_succeeded: runStats.succeeded,
            deliveries_failed: runStats.failed
        }).eq("id", runId);
    }

    result.ok = true;
    result.message = `Entrega finalizada. Sucesso: ${runStats.succeeded}, Falha: ${runStats.failed}, Pulos: ${runStats.skipped}`;
    result.attempted = runStats.attempted;
    result.succeeded = runStats.succeeded;
    result.failed = runStats.failed;
    result.skipped = runStats.skipped;

    return result;
}
