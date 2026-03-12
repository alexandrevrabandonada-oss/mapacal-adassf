import { listAlertEvents } from "@/lib/alerts/list-alert-events";
import { listAlertRuns } from "@/lib/alerts/list-alert-runs";
import { listWebhookDestinations } from "@/lib/alerts/list-webhook-destinations";
import { listAlertDeliveries } from "@/lib/alerts/list-alert-deliveries";
import { listAlertDeliveryRuns } from "@/lib/alerts/list-alert-delivery-runs";
import { listRetryableAlertDeliveries } from "@/lib/alerts/list-retryable-alert-deliveries";
import { TopNav } from "@/components/top-nav";
import { AdminAlertsClient } from "./client-page";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
    const [
        eventsResult,
        runsResult,
        destinationsResult,
        deliveriesResult,
        deliveryRunsResult,
        retryableResult
    ] = await Promise.all([
        listAlertEvents(null, 100),
        listAlertRuns(50),
        listWebhookDestinations(),
        listAlertDeliveries(50),
        listAlertDeliveryRuns(20),
        listRetryableAlertDeliveries(100)
    ]);

    return (
        <div className="min-h-screen bg-zinc-50 pb-20">
            <TopNav />
            <main className="mx-auto max-w-[1200px] px-4 py-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Administração de Alertas e Webhooks</h1>

                {(!eventsResult.ok || !runsResult.ok) ? (
                    <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
                        <h2 className="text-lg font-bold mb-2">Erro ao carregar dados</h2>
                        <p className="font-mono text-sm">{eventsResult.message || runsResult.message}</p>
                    </div>
                ) : (
                    <AdminAlertsClient
                        initialEvents={eventsResult.items}
                        initialRuns={runsResult.items}
                        destinations={destinationsResult.ok ? destinationsResult.items : []}
                        deliveries={deliveriesResult.ok ? deliveriesResult.items : []}
                        deliveryRuns={deliveryRunsResult.ok ? deliveryRunsResult.items : []}
                        retryableDeliveries={retryableResult.ok ? retryableResult.items : []}
                    />
                )}
            </main>
        </div>
    );
}
