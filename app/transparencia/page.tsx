import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import { SummaryCards } from "@/components/transparency/summary-cards";
import { ConditionBreakdown } from "@/components/transparency/condition-breakdown";
import { NeighborhoodBreakdown } from "@/components/transparency/neighborhood-breakdown";
import { TimelineList } from "@/components/transparency/timeline-list";
import { ExportPanel } from "@/components/transparency/export-panel";
import { TimeWindowTabs } from "@/components/filters/time-window-tabs";
import { ShareSnapshotPanel } from "@/components/filters/share-snapshot-panel";
import { getTransparencySummary } from "@/lib/reports/get-transparency-summary";
import { getTransparencyBreakdowns } from "@/lib/reports/get-transparency-breakdowns";
import { parseTimeWindowFromSearchParams, getTimeWindowLabel } from "@/lib/filters/time-window";
import { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getAppBaseUrl();
  const title = "Transparência Pública - Mapa Calçadas SF";
  const desc = "Acompanhe as estatísticas consolidadas de zeladoria, moderação e priorização cidadã no Mapa Calçadas de San Francisco.";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${baseUrl}/transparencia`,
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

export default async function TransparenciaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseTimeWindowFromSearchParams(params);

  // Buscar dados em paralelo
  const [summaryResult, breakdownsResult] = await Promise.all([
    getTransparencySummary(days),
    getTransparencyBreakdowns(days)
  ]);

  const hasSummary = summaryResult.ok && summaryResult.summary;
  const hasBreakdowns = breakdownsResult.ok && breakdownsResult.breakdowns;

  // URL para compartilhamento
  const snapshotUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/snapshots/transparencia?days=${days}`;

  return (
    <SiteShell
      title="Transparencia"
      subtitle="Painel publico mostrando dados agregados de relatos de calcadas. Mostramos apenas registros publicados no mapa."
    >
      {!hasSummary && summaryResult.reason === "env-missing" ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>Sem conexao com Supabase, o painel de transparencia fica indisponivel.</p>
          <p className="mt-2 text-xs text-zinc-600">
            Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </p>
        </SectionCard>
      ) : null}

      {!hasSummary && summaryResult.reason === "rpc-missing" ? (
        <SectionCard
          title="RPCs nao aplicadas"
          eyebrow="SQL necessario"
        >
          <p>
            As metricas de transparencia requerem aplicacao de T10_time_windows_and_snapshots.sql no Supabase SQL Editor.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Consulte docs/T10_TIME_WINDOWS_AND_SNAPSHOTS.md para instruções.
          </p>
        </SectionCard>
      ) : null}

      {hasSummary ? (
        <>
          <SectionCard title={`Recorte temporal: ${getTimeWindowLabel(days)}`} eyebrow="Filtros temporais">
            <TimeWindowTabs basePath="/transparencia" />
          </SectionCard>

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
              <TimelineList
                data={breakdownsResult.breakdowns.timeline}
              />
            </>
          ) : null}

          <ExportPanel days={days} />

          <ShareSnapshotPanel
            snapshotUrl={snapshotUrl}
            days={days}
          />

          <SectionCard title="Leitura territorial" eyebrow="Prioridade por bairro">
            <p className="mb-2 text-sm text-zinc-700">
              Para decidir onde incidencia e mutirao devem comecar, abra o painel de cobertura territorial.
            </p>
            <a
              href={`/territorio?days=${days}`}
              className="inline-block border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
            >
              Ver leitura territorial
            </a>
          </SectionCard>

          <SectionCard title="Comparacao entre periodos" eyebrow="Dinamica de mudanca">
            <p className="mb-2 text-sm text-zinc-700">
              Veja como a situacao se acelerou ou melhorou comparando com periodos anteriores.
              Compare por taxa diaria para evitar ilusoes causadas por periodos de tamanhos diferentes.
            </p>
            <a
              href={`/comparativos?days=${days}&baselineDays=${days === 7 ? 30 : days === 30 ? 90 : 365}`}
              className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
            >
              Abrir comparacao
            </a>
          </SectionCard>

          <SectionCard title="Timeline temporal" eyebrow="Ritmo no tempo">
            <p className="mb-2 text-sm text-zinc-700">
              Entenda quando a intensidade acelera ao longo de dia/semana e quais bairros/condicoes concentraram hotspots temporais.
            </p>
            <a
              href={`/timeline?days=${days}&bucket=day`}
              className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
            >
              Abrir timeline
            </a>
          </SectionCard>

          <SectionCard title="Snapshots materializados" eyebrow="Historico congelado">
            <p className="mb-2 text-sm text-zinc-700">
              Quer um link que nao muda com o tempo? Use snapshots congelados com data/hora fixa.
              Eles servem para citacao publica e comparacao auditavel entre estados.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/snapshots/materializados/transparencia"
                className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver snapshots de transparencia
              </a>
              <a
                href="/admin/snapshots"
                className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Criar snapshot (admin)
              </a>
            </div>
          </SectionCard>

          <SectionCard title="Sobre esses dados" eyebrow="Esclarecimentos">
            <ul className="space-y-1 text-sm text-zinc-700">
              <li>
                <span className="font-semibold">Publicados:</span> relatos que passaram por moderacao e entraram no mapa.
              </li>
              <li>
                <span className="font-semibold">Verificados:</span> relatos com confirmacoes de outros usuarios.
              </li>
              <li>
                <span className="font-semibold">Pendentes:</span> relatos na fila aguardando moderacao.
              </li>
              <li>
                <span className="font-semibold">Revisao:</span> relatos que requerem revisao antes de publicacao.
              </li>
              <li>
                <span className="font-semibold">Ocultos:</span> relatos removidos por violacao de politica.
              </li>
            </ul>
          </SectionCard>

          <SectionCard title="Como participar" eyebrow="Chame-se para agir">
            <p className="mb-2 text-sm">
              Voce pode criar relatos, confirmar problemas existentes e acompanhar publicacoes.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/novo"
                className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
              >
                Novo relato
              </a>
              <a
                href="/mapa"
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Ver mapa
              </a>
            </div>
          </SectionCard>
        </>
      ) : null}
    </SiteShell>
  );
}
