"use client";

import { useState } from "react";
import { AlertEventItem, AlertRunItem } from "@/lib/alerts/alert-types";
import { WebhookDestinationItem, AlertDeliveryItem, AlertDeliveryRunItem } from "@/lib/alerts/webhook-types";
import { RetryableDeliveryItem } from "@/lib/alerts/delivery-retry-types";
import { AlertCard } from "@/components/alerts/alert-card";
import { AlertRunList } from "@/components/alerts/alert-run-list";
import { WebhookDestinationList } from "@/components/alerts/webhook-destination-list";
import { DeliveryRunList } from "@/components/alerts/delivery-run-list";
import { DeliveryList } from "@/components/alerts/delivery-list";
import { WebhookMethodologyNote } from "@/components/alerts/webhook-methodology-note";
import { RetryMethodologyNote } from "@/components/alerts/retry-methodology-note";

type Props = {
    initialEvents: AlertEventItem[];
    initialRuns: AlertRunItem[];
    destinations: WebhookDestinationItem[];
    deliveries: AlertDeliveryItem[];
    deliveryRuns: AlertDeliveryRunItem[];
    retryableDeliveries: RetryableDeliveryItem[];
};

export function AdminAlertsClient({ initialEvents, initialRuns, destinations, deliveries, deliveryRuns, retryableDeliveries }: Props) {
    const [events, setEvents] = useState<AlertEventItem[]>(initialEvents);
    const [runs] = useState<AlertRunItem[]>(initialRuns);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isDelivering, setIsDelivering] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        try {
            const res = await fetch("/api/admin/alerts/evaluate", { method: "POST", body: JSON.stringify({ source: "manual" }) });
            const data = await res.json();
            if (!data.ok) {
                alert("Erro: " + data.message);
            } else {
                alert(`Avaliação concluída. ${data.alertsCreated} alertas novos gerados.`);
                window.location.reload();
            }
        } catch (e) {
            alert("Erro de rede: " + (e instanceof Error ? e.message : String(e)));
        }
        setIsEvaluating(false);
    };

    const handleDeliver = async (dryRun: boolean) => {
        setIsDelivering(true);
        try {
            const res = await fetch("/api/admin/alerts/deliver", { method: "POST", body: JSON.stringify({ source: "manual", dryRun }) });
            const data = await res.json();
            if (!data.ok) {
                alert("Erro: " + data.message);
            } else {
                alert(`Entrega concluída. Sucesso: ${data.succeeded}, Falhas: ${data.failed}, Skippados: ${data.skipped}`);
                if (!dryRun) window.location.reload();
            }
        } catch (e) {
            alert("Erro de rede: " + (e instanceof Error ? e.message : String(e)));
        }
        setIsDelivering(false);
    }

    const handleRetry = async (deliveryId?: string) => {
        setIsRetrying(true);
        try {
            const res = await fetch("/api/admin/alerts/deliver/retry", {
                method: "POST",
                body: JSON.stringify({ deliveryId })
            });
            const data = await res.json();
            if (!data.ok) {
                alert("Erro: " + data.message);
            } else {
                alert(`Retry concluído. Succeeded: ${data.succeeded}, Failed: ${data.failed}.`);
                window.location.reload();
            }
        } catch (e) {
            alert("Erro de rede: " + (e instanceof Error ? e.message : String(e)));
        }
        setIsRetrying(false);
    }

    const handleStatusChange = async (id: string, newStatus: "open" | "acknowledged" | "dismissed") => {
        try {
            const res = await fetch("/api/admin/alerts/status", {
                method: "POST",
                body: JSON.stringify({ alertId: id, status: newStatus }),
            });
            const data = await res.json();
            if (data.ok) {
                setEvents(events.map(e => e.id === id ? { ...e, status: newStatus } : e));
            } else {
                alert("Erro ao atualizar status: " + data.message);
            }
        } catch (e) {
            alert("Erro ao atualizar: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    const openEvents = events.filter(e => e.status === "open");
    const otherEvents = events.filter(e => e.status !== "open");

    return (
        <div className="space-y-12">

            {/* Secao de Geracao de Alertas (T13 Base) */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">1. Geração de Alertas</h2>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">Avaliação Manual de Anomalias</h3>
                        <p className="text-sm text-zinc-500">Varre o banco em busca de acelerações na degradação.</p>
                    </div>
                    <button
                        onClick={handleEvaluate}
                        disabled={isEvaluating}
                        className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                        {isEvaluating ? "Avaliando..." : "Gerar Alertas"}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Alertas Abertos ({openEvents.length})</h3>
                        <div className="space-y-4">
                            {openEvents.map(alert => (
                                <div key={alert.id} className="relative">
                                    <AlertCard alert={alert} adminHref={false} />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button onClick={() => handleStatusChange(alert.id, "acknowledged")} className="text-[10px] uppercase font-bold tracking-wider rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600 hover:bg-zinc-100">Reconhecer</button>
                                        <button onClick={() => handleStatusChange(alert.id, "dismissed")} className="text-[10px] uppercase font-bold tracking-wider rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600 hover:bg-zinc-100">Ignorar</button>
                                    </div>
                                </div>
                            ))}
                            {openEvents.length === 0 && <p className="text-sm text-zinc-500">Nenhum alerta aberto.</p>}
                        </div>

                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 mt-8 mb-4">Reconhecidos ou Ignorados ({otherEvents.length})</h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {otherEvents.map(alert => (
                                <div key={alert.id} className="relative opacity-60">
                                    <AlertCard alert={alert} adminHref={false} />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button onClick={() => handleStatusChange(alert.id, "open")} className="text-[10px] uppercase font-bold tracking-wider rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600 hover:bg-zinc-100">Reabrir</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Histórico de Gefação (Runs)</h3>
                        <AlertRunList runs={runs} />
                    </div>
                </div>
            </section>

            {/* Secao de Entrega Externa (T13b & T13c) */}
            <section className="space-y-6 pt-6 border-t">
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">2. Entrega Externa (Webhooks)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WebhookMethodologyNote />
                    <RetryMethodologyNote />
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">Disparo Manual de Entregas</h3>
                        <p className="text-sm text-zinc-500">Envia Alertas Abertos para os Webhooks Ativos.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDeliver(true)}
                            disabled={isDelivering}
                            className="rounded border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        >
                            Dry Run (Testar)
                        </button>
                        <button
                            onClick={() => handleDeliver(false)}
                            disabled={isDelivering || isRetrying}
                            className="rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                            {isDelivering ? "Entregando..." : "Entregar Agora"}
                        </button>
                    </div>
                </div>

                {retryableDeliveries.length > 0 && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-orange-900">Retentativas Pendentes ({retryableDeliveries.length})</h3>
                            <p className="text-sm text-orange-700">Falhas temporárias aguardando re-processamento.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRetry()}
                                disabled={isRetrying || isDelivering}
                                className="rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            >
                                {isRetrying ? "Processando..." : "Reenviar Elegíveis"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900">Destinos de Webhook Configurados</h3>
                    <WebhookDestinationList destinations={destinations} />
                    <p className="text-xs text-zinc-500 italic mt-2">Para cadastrar novos destinos ou editar, utilize ferramentas de banco de dados (Supabase) ou painéis avançados (TBD).</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Últimas Tentativas Individuais</h3>
                        <DeliveryList deliveries={deliveries} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Histórico de Corridas de Entrega</h3>
                        <DeliveryRunList runs={deliveryRuns} />
                    </div>
                </div>

            </section>

        </div>
    );
}
