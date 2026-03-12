import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { NeighborhoodPriorityTable } from "@/components/territory/neighborhood-priority-table";
import { PrioritySummaryCards } from "@/components/territory/priority-summary-cards";
import { RecentAlertsList } from "@/components/territory/recent-alerts-list";
import { PriorityScoreExplainer } from "@/components/territory/priority-score-explainer";
import { TimeWindowTabs } from "@/components/filters/time-window-tabs";
import { ShareSnapshotPanel } from "@/components/filters/share-snapshot-panel";
import { getNeighborhoodPriorityBreakdown } from "@/lib/reports/get-neighborhood-priority-breakdown";
import { getNeighborhoodRecentAlerts } from "@/lib/reports/get-neighborhood-recent-alerts";
import { parseTimeWindowFromSearchParams, getTimeWindowLabel } from "@/lib/filters/time-window";
import { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getAppBaseUrl();
  const title = "Cobertura Territorial - Mapa Calçadas SF";
  const desc = "Pontuação de risco e prioridade por bairros. Onde o problema de calçadas aparece com mais força em San Francisco.";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${baseUrl}/territorio`,
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

export default async function TerritorioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseTimeWindowFromSearchParams(params);

  const [rankingResult, alertsResult] = await Promise.all([
    getNeighborhoodPriorityBreakdown(days),
    getNeighborhoodRecentAlerts(20, days)
  ]);

  const hasData = rankingResult.ok && rankingResult.items.length > 0;

  const neighborhoodsWithVerified = rankingResult.items.filter((item) => item.total_verified > 0).length;
  const neighborhoodsWithBlocked = rankingResult.items.filter((item) => item.total_blocked > 0).length;

  // URL para compartilhamento
  const snapshotUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/snapshots/territorio?days=${days}`;

  return (
    <SiteShell
      title="Cobertura territorial"
      subtitle="Onde o problema aparece com mais forca. Leitura publica para puxar prioridade de rua, incidencia politica e mutirao de bairro."
    >
      {!hasData && rankingResult.reason === "env-missing" ? (
        <SectionCard title="Leitura territorial indisponivel" eyebrow="Configuracao">
          <p>{rankingResult.message || "Supabase nao configurado neste ambiente."}</p>
        </SectionCard>
      ) : null}

      {!hasData && rankingResult.reason === "rpc-missing" ? (
        <SectionCard title="SQL T09/T10 pendente" eyebrow="Banco">
          <p>{rankingResult.message || "A camada territorial ainda nao foi aplicada."}</p>
          <p className="mt-2 text-xs text-zinc-600">
            Rode `supabase/sql/T10_time_windows_and_snapshots.sql` no SQL Editor.
          </p>
        </SectionCard>
      ) : null}

      {hasData ? (
        <>
          <SectionCard title={`Recorte temporal: ${getTimeWindowLabel(days)}`} eyebrow="A prioridade varia com o período">
            <p className="mb-3 text-xs text-zinc-600 italic">
              Score se recalcula conforme a janela temporal. Períodos mais curtos revelam urgências recentes; períodos mais longos mostram tendências estruturais.
            </p>
            <TimeWindowTabs basePath="/territorio" />
          </SectionCard>

          <PrioritySummaryCards
            neighborhoods_with_records={rankingResult.items.length}
            neighborhoods_with_verified={neighborhoodsWithVerified}
            neighborhoods_with_blocked={neighborhoodsWithBlocked}
            analyzed_days={days}
          />

          <NeighborhoodPriorityTable items={rankingResult.items} />
          <RecentAlertsList items={alertsResult.items} />
          <PriorityScoreExplainer />

          <ShareSnapshotPanel
            snapshotUrl={snapshotUrl}
            days={days}
          />

          <SectionCard title="Pontes de acao" eyebrow="Do diagnostico para rua">
            <p className="mb-3 text-sm text-zinc-700">
              Use esta pagina para definir onde comecar. Depois desca para o mapa, acione comunidade e acompanhe transparencia.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/mapa?days=${days}`}
                className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
              >
                Ir para mapa
              </Link>
              <Link
                href="/novo"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Registrar novo ponto
              </Link>
              <Link
                href={`/transparencia?days=${days}`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Baixar dados e transparencia
              </Link>
              <Link
                href={`/comparativos?days=${days}&baselineDays=${days === 7 ? 30 : days === 30 ? 90 : 365}`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver comparacao de periodos
              </Link>
              <Link
                href={`/timeline?days=${days}&bucket=week`}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver timeline temporal
              </Link>
              <Link
                href="/alertas"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver Alertas
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Snapshots materializados" eyebrow="Territorio congelado">
            <p className="mb-3 text-sm text-zinc-700">
              Para compartilhar um estado fixo de cobertura territorial, use snapshots materializados.
              Diferente da janela movel, o snapshot fica congelado em data/hora especifica.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/snapshots/materializados/territorio"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver snapshots territoriais
              </Link>
              <Link
                href="/admin/snapshots"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Criar snapshot/diff (admin)
              </Link>
            </div>
          </SectionCard>
        </>
      ) : null}

      {!hasData && !rankingResult.reason ? (
        <SectionCard title="Sem dados territoriais ainda" eyebrow="Estado inicial">
          <p>Nenhum relato publicado com bairro informado no periodo selecionado.</p>
          <p className="mt-2 text-sm text-zinc-700">
            Assim que surgirem registros publicados, o ranking por prioridade aparecera automaticamente.
          </p>
        </SectionCard>
      ) : null}
    </SiteShell>
  );
}
