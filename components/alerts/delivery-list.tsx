"use client";

import { AlertDeliveryItem } from "@/lib/alerts/webhook-types";
import { DeliveryStatusBadge } from "./delivery-status-badge";


type Props = {
    deliveries: AlertDeliveryItem[];
};

export function DeliveryList({ deliveries }: Props) {
    if (deliveries.length === 0) {
        return <p className="text-sm text-gray-500">Nenhum envio registrado.</p>;
    }

    return (
        <div className="space-y-4">
            {deliveries.map((d) => (
                <div key={d.id} className="border p-4 rounded-md space-y-2 flex flex-col sm:flex-row justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <DeliveryStatusBadge status={(d as any).final_status || d.status} />
                            <span className="font-semibold text-sm">Destino: {d.destination_title || 'Desconhecido'}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            Alerta: {d.alert_title || d.alert_id}
                        </p>
                        <div className="text-xs text-gray-400 mt-1 flex space-x-4">
                            <span>Status: {d.response_status || 'N/A'}</span>
                            <span>{new Date(d.attempted_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}</span>
                        </div>
                    </div>
                    {d.response_excerpt && (
                        <div className="sm:w-1/3 mt-2 sm:mt-0 sm:ml-4 bg-gray-50 p-2 rounded text-xs border border-gray-100 overflow-x-auto">
                            <span className="font-semibold block mb-1">Payload/Response:</span>
                            <pre className="text-[10px] whitespace-pre-wrap flex-1 min-h-full">
                                {d.response_excerpt}
                            </pre>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
