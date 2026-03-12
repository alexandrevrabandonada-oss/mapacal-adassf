/**
 * app/snapshots/territorio/page.tsx
 * Página pública leve para compartilhar snapshot de cobertura territorial
 */

import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { NeighborhoodPriorityTable } from "@/components/territory/neighborhood-priority-table";
import { PrioritySummaryCards } from "@/components/territory/priority-summary-cards";
import { getNeighborhoodPriorityBreakdown } from "@/lib/reports/get-neighborhood-priority-breakdown";
import { parseTimeWindowFromSearchParams, getTimeWindowLabel } from "@/lib/filters/time-window";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SnapshotTerritorioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseTimeWindowFromSearchParams(params);

  const rankingResult = await getNeighborhoodPriorityBreakdown(days);

  const hasData = rankingResult.ok && rankingResult.items.length > 0;

  const neighborhoodsWithVerified = rankingResult.items.filter((item) => item.total_verified > 0).length;
  const neighborhoodsWithBlocked = rankingResult.items.filter((item) => item.total_blocked > 0).length;

  return (
    <SiteShell
      title="Compartilhamento Territorial"
      subtitle={`Recorte temporal: ${getTimeWindowLabel(days)}`}
    >
      <SectionCard title="Sobre este link" eyebrow="Recorte movel">
        <p className="text-sm text-zinc-700">
          Ranking de prioridade territorial para o período {getTimeWindowLabel(days).toLowerCase()}.
          O score se recalcula conforme muda a janela temporal: períodos curtos revelam urgências recentes, períodos longos mostram tendências estruturais.
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Este link e estavel, mas os dados refletem o estado atual do banco. Para estado congelado, use snapshots materializados por ID.
        </p>
      </SectionCard>

      <SectionCard title="Precisa de estado congelado?" eyebrow="T11b materializado">
        <Link
          href="/snapshots/materializados/territorio"
          className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
        >
          Ver snapshots materializados
        </Link>
      </SectionCard>

      {!hasData && rankingResult.reason === "env-missing" ? (
        <SectionCard title="Configuracao necessaria" eyebrow="Supabase">
          <p>{rankingResult.message || "Supabase nao configurado neste ambiente."}</p>
        </SectionCard>
      ) : null}

      {!hasData && rankingResult.reason === "rpc-missing" ? (
        <SectionCard title="SQL T10 pendente" eyebrow="Banco">
          <p>{rankingResult.message || "A camada territorial ainda nao foi aplicada."}</p>
        </SectionCard>
      ) : null}

      {hasData ? (
        <>
          <PrioritySummaryCards
            neighborhoods_with_records={rankingResult.items.length}
            neighborhoods_with_verified={neighborhoodsWithVerified}
            neighborhoods_with_blocked={neighborhoodsWithBlocked}
            analyzed_days={days}
          />

          <NeighborhoodPriorityTable items={rankingResult.items} />

          <SectionCard title="Voltar" eyebrow="Navegação">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/territorio?days=${days}`}
                className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
              >
                ← Análise completa
              </Link>
              <Link
                href={`/mapa?days=${days}`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ir para mapa
              </Link>
            </div>
          </SectionCard>
        </>
      ) : null}

      {!hasData && !rankingResult.reason ? (
        <SectionCard title="Sem dados neste período" eyebrow="Estado inicial">
          <p>Nenhum relato publicado com bairro no período {getTimeWindowLabel(days).toLowerCase()}.</p>
          <p className="mt-2 text-sm text-zinc-700">
            Quando houver dados, o ranking aparecerá automaticamente.
          </p>
        </SectionCard>
      ) : null}
    </SiteShell>
  );
}
