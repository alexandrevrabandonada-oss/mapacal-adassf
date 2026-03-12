import { SectionCard } from "@/components/section-card";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { ComparisonWindowTabs } from "@/components/filters/comparison-window-tabs";
import { DeltaSummaryCards } from "@/components/comparison/delta-summary-cards";
import { ConditionDeltaTable } from "@/components/comparison/condition-delta-table";
import { NeighborhoodDeltaTable } from "@/components/comparison/neighborhood-delta-table";
import { AccelerationAlertsList } from "@/components/comparison/acceleration-alerts-list";
import { ComparisonMethodologyNote } from "@/components/comparison/comparison-methodology-note";
import { getPeriodDeltaSummary } from "@/lib/reports/get-period-delta-summary";
import { getConditionPeriodDeltas } from "@/lib/reports/get-condition-period-deltas";
import { getNeighborhoodPeriodDeltas } from "@/lib/reports/get-neighborhood-period-deltas";
import { getAccelerationAlerts } from "@/lib/reports/get-acceleration-alerts";
import {
  parseComparisonFromSearchParams,
  getComparisonLabel,
  normalizeCurrentWindow,
  normalizeBaselineWindow
} from "@/lib/filters/comparison-window";
import { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getAppBaseUrl();
  const title = "Comparação - Mapa Calçadas SF";
  const desc = "Dinâmica de agravamento e melhora entre períodos no reporte de calçadas.";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${baseUrl}/comparativos`,
      siteName: "Mapa Calçadas SF",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    }
  };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparativosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const comparison = parseComparisonFromSearchParams(params);
  const { currentDays, baselineDays } = comparison;

  // Buscar dados em paralelo
  const [summaryResult, conditionResult, neighborhoodResult, alertsResult] = await Promise.all([
    getPeriodDeltaSummary(currentDays, baselineDays),
    getConditionPeriodDeltas(currentDays, baselineDays),
    getNeighborhoodPeriodDeltas(currentDays, baselineDays),
    getAccelerationAlerts(currentDays, baselineDays, 12)
  ]);

  const hasSummary = summaryResult.ok && summaryResult.summary;
  const hasConditions = conditionResult.ok && conditionResult.deltas.length > 0;
  const hasNeighborhoods = neighborhoodResult.ok && neighborhoodResult.deltas.length > 0;
  const hasAlerts = alertsResult.ok && alertsResult.alerts.length > 0;

  const comparisonLabel = getComparisonLabel(currentDays, baselineDays);

  return (
    <SiteShell
      title="Comparativos"
      subtitle={`Dinâmica de agravamento e melhora entre períodos. Selecionado: ${comparisonLabel}`}
    >
      {/* Verificação de env missing */}
      {!hasSummary && summaryResult.reason === "env-missing" ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>Sem conexao com Supabase, o painel de comparativos fica indisponivel.</p>
          <p className="mt-2 text-xs text-zinc-600">
            Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </p>
        </SectionCard>
      ) : null}

      {/* Verificação de RPC missing */}
      {!hasSummary && summaryResult.reason === "rpc-missing" ? (
        <SectionCard title="RPCs nao aplicadas" eyebrow="Setup necessario">
          <p className="mb-2">
            O painel de comparativos requer as RPCs de deltas do SQL T11.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-600">
            <li>Copie o conteudo de supabase/sql/T11_period_deltas.sql</li>
            <li>Abra Supabase SQL Editor</li>
            <li>Cole e execute</li>
          </ol>
          <p className="mt-2 text-xs text-zinc-500">
            Depois recarregue esta pagina.
          </p>
        </SectionCard>
      ) : null}

      {/* Controles de comparação */}
      <SectionCard title="Selecionador de período" eyebrow="Comparacao">
        <p className="mb-3 text-sm text-zinc-700">
          Escolha uma comparacao para ver dinâmica de agravamento:
        </p>
        <ComparisonWindowTabs
          currentDays={normalizeCurrentWindow(currentDays)}
          baselineDays={normalizeBaselineWindow(baselineDays)}
          baseUrl="/comparativos"
        />
      </SectionCard>

      {/* Resumo de deltas se dados disponíveis */}
      {hasSummary ? (
        <>
          <DeltaSummaryCards summary={summaryResult.summary} />

          {/* Tabelas de deltas por condição e bairro */}
          {hasConditions ? (
            <ConditionDeltaTable deltas={conditionResult.deltas} />
          ) : (
            <SectionCard title="Deltas por Condição" eyebrow="Tipo de problema">
              <p className="text-sm text-zinc-600">Sem dados para comparar por condição.</p>
            </SectionCard>
          )}

          {hasNeighborhoods ? (
            <NeighborhoodDeltaTable
              deltas={neighborhoodResult.deltas}
              currentDays={currentDays}
            />
          ) : (
            <SectionCard title="Deltas por Bairro" eyebrow="Cobertura territorial">
              <p className="text-sm text-zinc-600">Sem dados para comparar por bairro.</p>
            </SectionCard>
          )}

          {/* Alertas de aceleração */}
          {hasAlerts ? (
            <AccelerationAlertsList
              alerts={alertsResult.alerts}
              currentDays={currentDays}
            />
          ) : (
            <SectionCard title="Alertas de Aceleração" eyebrow="Focos de piora">
              <p className="text-sm text-zinc-600">
                Sem alertas. Nenhum par bairro-condição mostrou agravamento no período.
              </p>
            </SectionCard>
          )}

          {/* Metodologia */}
          <ComparisonMethodologyNote />

          <SectionCard title="Comparativo movel vs diff congelado" eyebrow="Leitura honesta">
            <p className="mb-2 text-sm text-zinc-700">
              Esta tela usa janelas moveis (ex: 7 vs 30 dias), entao o mesmo link pode mudar com o tempo.
              Para citacao publica estavel, use snapshots materializados e gere um diff congelado entre dois estados.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/snapshots/materializados/transparencia"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver snapshots publicos
              </a>
              <a
                href="/snapshots/materializados/diffs"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver diffs congelados
              </a>
              <a
                href="/admin/snapshots"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Criar snapshot/diff (admin)
              </a>
            </div>
          </SectionCard>

          {/* CTAs de navegação */}
          <SectionCard title="Proximas etapas" eyebrow="Acao">
            <p className="mb-4 text-sm text-zinc-700">
              Use estas visualizações para entender para onde virar a incidência:
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/territorio?days=${currentDays}`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                → Abrir ranking territorial
              </a>
              <a
                href={`/mapa?days=${currentDays}`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                → Abrir mapa geografico
              </a>
              <a
                href={`/transparencia?days=${currentDays}`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                → Abrir transparencia
              </a>
              <a
                href={`/timeline?days=${currentDays}&bucket=week`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                → Abrir timeline temporal
              </a>
              <Link
                href="/alertas"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                → Ver Alertas Automáticos
              </Link>
            </div>
          </SectionCard>
        </>
      ) : null}
    </SiteShell>
  );
}
