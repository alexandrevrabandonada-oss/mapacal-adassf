import Link from "next/link";

import { getConditionLabel } from "@/lib/domain/sidewalk";
import type { PublicMapReportItem } from "@/lib/reports/list-published-types";

type ReportDetailCardProps = {
  item: PublicMapReportItem | null;
};

export function ReportDetailCard({ item }: ReportDetailCardProps) {
  return (
    <section className="border-2 border-[var(--ink)] bg-white p-3">
      <h3 className="text-xs font-black uppercase tracking-[0.12em]">Detalhe resumido</h3>
      {!item ? (
        <p className="mt-2 text-sm">Selecione um ponto na lista ou no mapa para ver detalhes.</p>
      ) : (
        <div className="mt-2 space-y-1 text-sm">
          <p>
            <span className="font-semibold">Condicao:</span> {getConditionLabel(item.condition)}
          </p>
          <p>
            <span className="font-semibold">Bairro:</span> {item.neighborhood || "Nao informado"}
          </p>
          <p>
            <span className="font-semibold">Data:</span> {new Date(item.created_at).toLocaleString("pt-BR")}
          </p>
          <p>
            <span className="font-semibold">Nota:</span> {item.note || "Sem observacao"}
          </p>
          <p>
            <span className="font-semibold">Confirmacoes:</span> {item.verification_count}
          </p>
          {item.is_verified ? (
            <span className="inline-block border border-[var(--ink)] bg-[var(--signal)] px-2 py-0.5 text-[11px] font-bold uppercase">
              Verificado
            </span>
          ) : null}
          <div className="pt-2">
            <Link
              href={`/r/${item.id}`}
              className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
            >
              Abrir detalhe publico
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
