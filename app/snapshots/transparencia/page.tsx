/**
 * app/snapshots/transparencia/page.tsx
 * Página pública leve para compartilhar snapshot de transparência
 */

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import { SummaryCards } from "@/components/transparency/summary-cards";
import { ConditionBreakdown } from "@/components/transparency/condition-breakdown";
import { NeighborhoodBreakdown } from "@/components/transparency/neighborhood-breakdown";
import { ExportPanel } from "@/components/transparency/export-panel";
import { getTransparencySummary } from "@/lib/reports/get-transparency-summary";
import { getTransparencyBreakdowns } from "@/lib/reports/get-transparency-breakdowns";
import { parseTimeWindowFromSearchParams, getTimeWindowLabel } from "@/lib/filters/time-window";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SnapshotTransparenciaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseTimeWindowFromSearchParams(params);

  const [summaryResult, breakdownsResult] = await Promise.all([
    getTransparencySummary(days),
    getTransparencyBreakdowns(days)
  ]);

  const hasSummary = summaryResult.ok && summaryResult.summary;
  const hasBreakdowns = breakdownsResult.ok && breakdownsResult.breakdowns;

  return (
    <SiteShell
      title="Compartilhamento de Transparencia"
      subtitle={`Recorte movel: ${getTimeWindowLabel(days)}`}
    >
      <SectionCard title="Sobre este link" eyebrow="Recorte movel">
        <p className="text-sm text-zinc-700">
          Este link representa dados publicados e agregados do período {getTimeWindowLabel(days).toLowerCase()}.
          A URL e estavel, mas os dados refletem sempre o estado atual do banco.
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Para historico congelado e citavel, use snapshots materializados por ID em /snapshots/transparencia/[id].
        </p>
      </SectionCard>

      <SectionCard title="Precisa de estado congelado?" eyebrow="T11b materializado">
        <a
          href="/snapshots/materializados/transparencia"
          className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
        >
          Ver snapshots materializados
        </a>
      </SectionCard>

      {!hasSummary && summaryResult.reason === "env-missing" ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>Sem conexao com Supabase, o snapshot fica indisponivel.</p>
        </SectionCard>
      ) : null}

      {!hasSummary && summaryResult.reason === "rpc-missing" ? (
        <SectionCard title="RPCs nao aplicadas" eyebrow="SQL necessario">
          <p>Aplique T10_time_windows_and_snapshots.sql no Supabase SQL Editor.</p>
        </SectionCard>
      ) : null}

      {hasSummary ? (
        <>
          <SummaryCards
            total_published={summaryResult.summary?.total_published ?? 0}
            total_verified={summaryResult.summary?.total_verified ?? 0}
            total_pending={summaryResult.summary?.total_pending ?? 0}
            total_needs_review={summaryResult.summary?.total_needs_review ?? 0}
            total_hidden={summaryResult.summary?.total_hidden ?? 0}
          />

          {hasBreakdowns && breakdownsResult.breakdowns ? (
            <>
              <ConditionBreakdown
                data={breakdownsResult.breakdowns.conditions}
              />
              <NeighborhoodBreakdown
                data={breakdownsResult.breakdowns.neighborhoods}
              />
            </>
          ) : null}

          <ExportPanel days={days} />

          <SectionCard title="Voltar" eyebrow="Navegação">
            <a
              href={`/transparencia?days=${days}`}
              className="inline-block border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
            >
              ← Voltar para análise completa
            </a>
          </SectionCard>
        </>
      ) : null}
    </SiteShell>
  );
}
