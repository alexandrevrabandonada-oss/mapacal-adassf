import { AlertEventItem } from "@/lib/alerts/alert-types";
import { AlertBadge } from "./alert-badge";
import Link from "next/link";

export function AlertCard({ alert, adminHref }: { alert: AlertEventItem; adminHref?: boolean }) {
    const dateStr = new Date(alert.created_at).toLocaleDateString("pt-BR", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    return (
        <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <AlertBadge severity={alert.severity} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Escopo: {alert.scope}
                    </span>
                </div>
                <time className="text-xs text-zinc-500">{dateStr}</time>
            </div>

            <h3 className="text-base font-bold text-zinc-900 leading-snug">{alert.title}</h3>
            {alert.summary && (
                <p className="mt-2 text-sm text-zinc-600 line-clamp-3 leading-relaxed">
                    {alert.summary}
                </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {alert.neighborhood && (
                    <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                        Bairro: {alert.neighborhood}
                    </span>
                )}
                {alert.condition && (
                    <span className="inline-flex rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                        Condição: {alert.condition}
                    </span>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
                {alert.neighborhood && (
                    <Link
                        href={`/territorio?bairro=${encodeURIComponent(alert.neighborhood)}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        Ver no Territorio &rarr;
                    </Link>
                )}
                {alert.condition && (
                    <Link
                        href={`/comparativos?condition=${encodeURIComponent(alert.condition)}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        Ver Timeline da Condicao &rarr;
                    </Link>
                )}
                {adminHref && (
                    <Link
                        href={`/admin/alertas`}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-800 ml-auto"
                    >
                        Gerenciar Status Admin
                    </Link>
                )}
            </div>
        </article>
    );
}
