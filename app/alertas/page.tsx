import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { listAlertEvents } from "@/lib/alerts/list-alert-events";
import { AlertCard } from "@/components/alerts/alert-card";
import { AlertMethodologyNote } from "@/components/alerts/alert-methodology-note";

export const dynamic = "force-dynamic";

export default async function PublicAlertsPage() {
    const result = await listAlertEvents("open", 100);

    return (
        <SiteShell
            title="Radar de Alertas"
            subtitle="Sinais automaticos de agravamento e anomalias na infraestrutura"
        >
            <div className="space-y-8 max-w-4xl">
                <AlertMethodologyNote />

                <SectionCard title="Alertas Ativos" eyebrow="Visao Geral">
                    {!result.ok ? (
                        <div className="rounded bg-red-50 p-4 text-red-800 text-sm">
                            <p className="font-bold">Erro ao carregar alertas.</p>
                            <p>{result.message}</p>
                        </div>
                    ) : result.items.length === 0 ? (
                        <div className="rounded border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-500">
                            <p>Nenhum alerta publico ou anomalia massiva ativa no momento.</p>
                            <p className="text-xs mt-2">O sistema verifica as tendencias constantemente.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                            {result.items.map((alert) => (
                                <AlertCard key={alert.id} alert={alert} />
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </SiteShell>
    );
}
