"use client";

import { RetryableDeliveryItem } from "@/lib/alerts/delivery-retry-types";
import { DeliveryStatusBadge } from "./delivery-status-badge";

type Props = {
    deliveries: RetryableDeliveryItem[];
    onRetry: (id: string) => void;
    isRetrying: boolean;
};

export function RetryableDeliveryList({ deliveries, onRetry, isRetrying }: Props) {
    if (deliveries.length === 0) {
        return <p className="text-sm text-gray-500">Nenhum alerta elegível para re-entrega.</p>;
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {deliveries.map((d) => (
                <div key={d.id} className="border p-4 rounded-md space-y-2 flex flex-col sm:flex-row justify-between bg-white shadow-sm">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <DeliveryStatusBadge status={d.final_status} />
                            <span className="font-semibold text-sm">Destino: {d.destination_title || 'Desconhecido'}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            Alerta: {d.alert_title}
                        </p>
                        <div className="text-xs text-gray-400 mt-1 flex space-x-4">
                            <span>Status HTTP: {d.response_status || 'N/A'}</span>
                            <span>Tentativa: {d.attempt_number}</span>
                            <span>Proxy URL: {d.webhook_url.substring(0, 30)}...</span>
                        </div>
                        <div className="text-xs text-red-500 mt-1 bg-red-50 p-1 inline-block rounded border border-red-100">
                            Tentará dnv em: {new Date(d.next_retry_at || d.attempted_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col justify-center items-end border-l pl-4">
                        <button
                            onClick={() => onRetry(d.id)}
                            disabled={isRetrying}
                            className="bg-black text-white px-3 py-1 text-xs rounded hover:bg-zinc-800 disabled:opacity-50"
                        >
                            Forçar Retry
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
