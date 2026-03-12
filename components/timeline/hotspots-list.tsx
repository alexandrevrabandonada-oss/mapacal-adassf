import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import type { TemporalHotspotItem } from "@/lib/reports/get-temporal-hotspots";

type HotspotsListProps = {
  items: TemporalHotspotItem[];
  days: number;
  bucket: "day" | "week";
};

export function HotspotsList({ items, days, bucket }: HotspotsListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Hotspots temporais" eyebrow="Concentracao por bairro e condicao">
      <div className="space-y-2">
        {items.map((item) => (
          <article key={`${item.neighborhood}-${item.condition}`} className="border border-zinc-300 bg-white p-2">
            <p className="text-xs font-black uppercase tracking-[0.08em]">
              {item.neighborhood} | {item.condition}
            </p>
            <p className="mt-1 text-xs text-zinc-700">
              Volume: {item.count} | Verificados: {item.verified_count} | Bloqueados: {item.blocked_count}
            </p>
            <p className="mt-1 text-xs text-zinc-700">
              Recencia: {new Date(item.latest_bucket).toLocaleDateString("pt-BR")} | Score: {item.hotspot_score.toFixed(2)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/mapa?days=${days}`}
                className="border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[11px] font-bold uppercase hover:bg-[var(--signal)]"
              >
                Abrir no mapa
              </Link>
              <Link
                href={`/territorio?days=${days}`}
                className="border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[11px] font-bold uppercase hover:bg-[var(--signal)]"
              >
                Abrir no territorio
              </Link>
              <Link
                href={`/comparativos?days=${days}&baselineDays=${days === 7 ? 30 : days === 30 ? 90 : 365}`}
                className="border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[11px] font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver comparativos
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-600">Bucket atual: {bucket === "day" ? "dia" : "semana"}.</p>
    </SectionCard>
  );
}
