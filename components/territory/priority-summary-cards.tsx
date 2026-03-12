import { SectionCard } from "@/components/section-card";

type PrioritySummaryCardsProps = {
  neighborhoods_with_records: number;
  neighborhoods_with_verified: number;
  neighborhoods_with_blocked: number;
  analyzed_days: number;
};

export function PrioritySummaryCards({
  neighborhoods_with_records,
  neighborhoods_with_verified,
  neighborhoods_with_blocked,
  analyzed_days
}: PrioritySummaryCardsProps) {
  return (
    <SectionCard title="Pulso territorial" eyebrow="Leitura por bairro">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">Bairros com registros</p>
          <p className="mt-2 text-4xl font-black">{neighborhoods_with_records}</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">Bairros com verificados</p>
          <p className="mt-2 text-4xl font-black">{neighborhoods_with_verified}</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">Bairros com bloqueios</p>
          <p className="mt-2 text-4xl font-black">{neighborhoods_with_blocked}</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">Periodo analisado</p>
          <p className="mt-2 text-4xl font-black">{analyzed_days}</p>
          <p className="text-xs text-zinc-600">dias</p>
        </div>
      </div>
    </SectionCard>
  );
}
