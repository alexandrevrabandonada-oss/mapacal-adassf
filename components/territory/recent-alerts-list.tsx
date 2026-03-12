import Link from "next/link";

import { getConditionLabel } from "@/lib/domain/sidewalk";
import type { NeighborhoodRecentAlertItem } from "@/lib/reports/get-neighborhood-recent-alerts";

type RecentAlertsListProps = {
  items: NeighborhoodRecentAlertItem[];
};

export function RecentAlertsList({ items }: RecentAlertsListProps) {
  return (
    <section className="border-2 border-[var(--ink)] bg-white p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.12em]">Alertas recentes</h3>
      <p className="mt-2 text-sm text-zinc-700">Primeiro os casos graves, depois os mais recentes.</p>

      {items.length === 0 ? (
        <p className="mt-3 text-sm">Sem alertas publicados no momento.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="border border-[var(--ink)] bg-[var(--paper)] p-2">
              <p className="text-xs font-bold uppercase tracking-[0.08em]">{item.neighborhood}</p>
              <p className="text-sm font-semibold">{getConditionLabel(item.condition)}</p>
              <p className="text-xs text-zinc-700">
                {new Date(item.created_at).toLocaleString("pt-BR")} | Confirmacoes: {item.verification_count}
                {item.has_photo ? " | Com foto" : ""}
              </p>
              <Link
                href={`/r/${item.id}`}
                className="mt-2 inline-block border-2 border-[var(--ink)] bg-white px-2 py-1 text-[11px] font-bold uppercase hover:bg-[var(--signal)]"
              >
                Abrir relato
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
