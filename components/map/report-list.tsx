import { getConditionLabel } from "@/lib/domain/sidewalk";
import type { PublicMapReportItem } from "@/lib/reports/list-published-types";

type ReportListProps = {
  items: PublicMapReportItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ReportList({ items, selectedId, onSelect }: ReportListProps) {
  if (items.length === 0) {
    return (
      <section className="border-2 border-[var(--ink)] bg-white p-3">
        <p className="text-sm">Nenhum registro publicado encontrado com os filtros atuais.</p>
      </section>
    );
  }

  return (
    <section className="space-y-2 border-2 border-[var(--ink)] bg-white p-3">
      <h3 className="text-xs font-black uppercase tracking-[0.12em]">Lista publica</h3>
      <ul className="max-h-80 space-y-2 overflow-auto pr-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full border-2 px-3 py-2 text-left text-sm ${
                selectedId === item.id
                  ? "border-[var(--ink)] bg-[var(--signal)]"
                  : "border-zinc-300 bg-[var(--paper)] hover:border-[var(--ink)]"
              }`}
            >
              <p className="font-semibold">{getConditionLabel(item.condition)}</p>
              <p>Bairro: {item.neighborhood || "Nao informado"}</p>
              <p>Data: {new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
              {item.is_verified ? (
                <span className="mt-1 inline-block border border-[var(--ink)] bg-white px-2 py-0.5 text-[11px] font-bold uppercase">
                  Verificado
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
