"use client";

import { AlertDeliveryRunItem } from "@/lib/alerts/webhook-types";

type Props = {
    runs: AlertDeliveryRunItem[];
};

export function DeliveryRunList({ runs }: Props) {
    if (runs.length === 0) {
        return <p className="text-sm text-gray-500">Nenhuma execução registrada.</p>;
    }

    return (
        <div className="space-y-4">
            {runs.map((r) => (
                <div key={r.id} className="border p-4 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                            Run Id: <span className="text-gray-600">{r.id.split("-")[0]}</span>
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'success' ? 'bg-green-100 text-green-800' :
                                r.status === 'error' ? 'bg-red-100 text-red-800' :
                                    r.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                                        r.status === 'skipped' ? 'bg-gray-100 text-gray-800' :
                                            'bg-blue-100 text-blue-800'
                            }`}>
                            {r.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 text-sm gap-2 mt-2">
                        <div>
                            <span className="text-gray-500">Fonte:</span> {r.source.toUpperCase()}
                        </div>
                        <div>
                            <span className="text-gray-500">Tentativas:</span> {r.deliveries_attempted}
                        </div>
                        <div>
                            <span className="text-gray-500">Sucesso:</span> {r.deliveries_succeeded}
                        </div>
                        <div>
                            <span className="text-gray-500">Falhas:</span> {r.deliveries_failed}
                        </div>
                    </div>
                    {r.message && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">{r.message}</p>}
                    <div className="text-xs text-gray-400 mt-1">
                        Iniciado em: {new Date(r.started_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                        {r.finished_at && ` - Encerrado em: ${new Date(r.finished_at).toLocaleTimeString("pt-BR", { timeStyle: "medium" })}`}
                    </div>
                </div>
            ))}
        </div>
    );
}
