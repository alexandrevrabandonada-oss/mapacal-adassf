import "server-only";

import { isSupabaseConfigured, getAlertWebhookUserAgent } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { DeliverAlertsMode, DeliverAlertsResult } from "./webhook-types";
import { buildSignatureHeaders } from "./webhook-signing";
import { listWebhookDestinations } from "./list-webhook-destinations";
import { listOpenAlertEventsForDelivery } from "./list-open-alert-events-for-delivery";

export async function deliverAlertsToWebhooks(
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

    // Precisamos do supabase admin pra inserir nas runs de delivery e bypass RLS se for via job/cron
    // O ideal eh usar server client se for manual e admin se for asAdmin. Usaremos Admin by default para as inserções operacionais caso chamado via cron
    const supabase = options?.asAdmin ? getSupabaseAdminClient() : await (await import("@/lib/supabase/server")).getSupabaseServerClient();
    if (!supabase) {
        result.reason = "env-missing";
        result.message = "Cliente Supabase não inicializado.";
        return result;
    }

    // 1. Listar Webhooks
    const destResponse = await listWebhookDestinations();
    if (!destResponse.ok) {
        result.reason = destResponse.reason;
        result.message = "Falha ao listar destinos: " + destResponse.message;
        return result;
    }

    const activeDestinations = destResponse.items.filter(d => d.is_enabled);
    if (activeDestinations.length === 0) {
        result.reason = "no-destinations";
        result.message = "Nenhum destino de webhook habilitado.";
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
        result.message = "Nenhum alerta aberto (novo) pendente.";
        // Ainda assim é um success vazio
        result.ok = true;
        return result;
    }

    const runStats = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
    let runId: string | null = null;

    if (!options?.dryRun) {
        // 3. Criar a Run
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

    // 4. Iniciar envios reais ou dry run
    const userAgent = getAlertWebhookUserAgent();

    for (const alert of alertsResponse.items) {
        for (const dest of activeDestinations) {
            // 4a. Verificar filtro do destino
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

            // 4b. Dedupe Rule:
            // Se alert já foi enviado pra esse webhook com success, pula.
            // Validamos via "EXISTS" lookup or "ON CONFLICT" if possible. We use the partial unique index:
            // alert_deliveries_dedupe_success_idx on (alert_id, destination_id) where status = 'success'.
            // If we attempt insert and get constraint conflict, it means it's already sent successfully.

            const payload = {
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
                    sentAt: new Date().toISOString()
                }
            };

            runStats.attempted++;

            if (options?.dryRun) {
                // Mock success
                runStats.succeeded++;
            } else {
                let deliveryIdGenerated: string | null = null;
                try {
                    // Pre-inserir a delivery com pending
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
                        // 23505 = unique_violation
                        if (deliveryError.code === "23505") {
                            runStats.skipped++;
                            runStats.attempted--;
                            continue;
                        }
                        console.error("Failed to insert delivery pending log:", deliveryError);
                        runStats.failed++;
                        continue;
                    }

                    const deliveryId = deliveryData.id;
                    deliveryIdGenerated = deliveryId;

                    const headers: HeadersInit = {
                        "Content-Type": "application/json",
                        "User-Agent": userAgent
                    };

                    // Header Legacy (Custom API Keys)
                    if (dest.secret_header_name && dest.secret_header_value) {
                        (headers as Record<string, string>)[dest.secret_header_name] = dest.secret_header_value;
                    }

                    const rawPayload = JSON.stringify(payload);

                    // Novo Header (Assinatura HMAC)
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

                    const fetchReq = await fetch(dest.webhook_url, {
                        method: "POST",
                        headers,
                        body: rawPayload
                    });

                    // Post-atualizar
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
                        // Determinar se e permanente
                        const isPermanent = respStatus >= 400 && respStatus < 500 && respStatus !== 429;
                        const errorCode = isPermanent ? 'PERMANENT_FAIL' : 'TEMP_FAIL';

                        // Chama RPC ao invez do UPDATE pra calcular o retry policy. 
                        await supabase.rpc("mark_alert_delivery_retry_result", {
                            in_delivery_id: deliveryId,
                            in_status: "failed",
                            in_response_status: respStatus,
                            in_response_excerpt: respExcerpt,
                            in_error_code: errorCode
                        });
                    }

                } catch (e: any) {
                    runStats.failed++;
                    console.error(`Falha brusca ao entregar ${alert.id} p/ ${dest.id}`, e);

                    if (deliveryIdGenerated) {
                        await supabase.rpc("mark_alert_delivery_retry_result", {
                            in_delivery_id: deliveryIdGenerated,
                            in_status: "failed",
                            in_response_status: 0,
                            in_response_excerpt: e?.message?.substring(0, 300) || "Erro brusco de Network",
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
