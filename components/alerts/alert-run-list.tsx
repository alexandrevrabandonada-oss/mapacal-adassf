import { AlertRunItem } from "@/lib/alerts/alert-types";

export function AlertRunList({ runs }: { runs: AlertRunItem[] }) {
    if (!runs || runs.length === 0) {
        return <p className="text-sm text-zinc-500">Nenhuma execução recente.</p>;
    }

    return (
        <div className="space-y-2">
            {runs.map((r) => (
                <div key={r.id} className="rounded border border-zinc-200 bg-white p-3 text-xs flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-700">
                            <span className={
                                r.status === "success" ? "text-green-600" :
                                    r.status === "error" ? "text-red-600" :
                                        r.status === "running" ? "text-blue-600" : "text-zinc-500"
                            }>
                                {r.status}
                            </span>
                            <span>- Origem: {r.source}</span>
                        </div>
                        <p className="mt-1 text-zinc-600 max-w-xl truncate">{r.message || "Sem mensagem"}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                        <p className="font-medium">{r.alerts_created} alertas novos</p>
                        <p className="text-zinc-500">{new Date(r.started_at).toLocaleString("pt-BR")}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
