"use client";

import { WebhookDestinationItem } from "@/lib/alerts/webhook-types";


type Props = {
    destinations: WebhookDestinationItem[];
};

export function WebhookDestinationList({ destinations }: Props) {
    if (destinations.length === 0) {
        return (
            <p className="text-sm text-gray-500">Nenhum destino de webhook cadastrado.</p>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
                <div key={d.id} className="border p-4 rounded-md bg-white shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                {d.title}
                                {d.destination_type === 'slack_webhook' && (
                                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full border border-blue-200">Slack</span>
                                )}
                                {d.destination_type === 'discord_webhook' && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full border border-indigo-200">Discord</span>
                                )}
                                {d.destination_type === 'telegram_bot' && (
                                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full border border-sky-200">Telegram</span>
                                )}
                                {d.destination_type === 'generic_webhook' && (
                                    <span className="text-[10px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-full border border-zinc-200">Webhook</span>
                                )}
                            </h3>
                            {d.is_enabled ? (
                                <span className="flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full"><span className="mr-1">✓</span> Ativo</span>
                            ) : (
                                <span className="flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full"><span className="mr-1">✗</span> Inativo</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{d.description || "Sem descrição"}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p><span className="font-medium text-gray-700">Slug:</span> {d.slug}</p>
                            <p><span className="font-medium text-gray-700">Filtros:</span> {Object.keys(d.event_filter).length > 0 ? JSON.stringify(d.event_filter) : "Nenhum (Todos)"}</p>

                            {d.signing_mode === 'hmac_sha256' ? (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded">
                                    <p className="font-semibold text-blue-800">Assinatura HMAC Ativada 🔒</p>
                                    <p>Header: {d.signing_header_name}</p>
                                    {d.signing_kid && <p>Key ID: {d.signing_kid}</p>}
                                </div>
                            ) : (
                                <p className="mt-2 text-amber-600">⚠ Sem Assinatura de Origem</p>
                            )}

                            <p className="italic mt-2">URL e Secrets ocultos por segurança.</p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-4 border-t pt-2">
                        Adicionado: {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </div>
                </div>
            ))}
        </div>
    );
}
