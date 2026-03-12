import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import { TimeWindowTabs } from "@/components/filters/time-window-tabs";
import { BucketToggle } from "@/components/timeline/bucket-toggle";
import { TimelineSeriesChart } from "@/components/timeline/timeline-series-chart";
import { TimelineConditionChart } from "@/components/timeline/timeline-condition-chart";
import { HotspotsList } from "@/components/timeline/hotspots-list";
import { TimelineMethodologyNote } from "@/components/timeline/timeline-methodology-note";
import { getTimeWindowLabel, parseTimeWindowFromSearchParams } from "@/lib/filters/time-window";
import { getTimelineSeries } from "@/lib/reports/get-timeline-series";
import { getTimelineConditionSeries } from "@/lib/reports/get-timeline-condition-series";
import { getTemporalHotspots } from "@/lib/reports/get-temporal-hotspots";
import { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getAppBaseUrl();
  const title = "Timeline Temporal - Mapa Calçadas SF";
  const desc = "Ritmo de publicação e concentração de hotspots ao longo do tempo no mapeamento cidadão.";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${baseUrl}/timeline`,
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

function normalizeBucket(bucket: string | string[] | undefined): "day" | "week" {
  const value = Array.isArray(bucket) ? bucket[0] : bucket;
  return value === "week" ? "week" : "day";
}

function normalizeString(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first || "").trim();
}

export default async function TimelinePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const days = parseTimeWindowFromSearchParams(params);
  const bucket = normalizeBucket(params.bucket);
  const neighborhood = normalizeString(params.neighborhood);

  const [seriesResult, conditionResult, hotspotsResult] = await Promise.all([
    getTimelineSeries(days, bucket, neighborhood || undefined),
    getTimelineConditionSeries(days, bucket, neighborhood || undefined),
    getTemporalHotspots(days, 20)
  ]);

  const hasSeries = seriesResult.ok && seriesResult.items.length > 0;

  return (
    <SiteShell
      title="Timeline temporal"
      subtitle="Ritmo de publicacao e concentracao de hotspots ao longo do tempo, com leitura publica sem promessa causal."
    >
      {seriesResult.reason === "env-missing" ? (
        <SectionCard title="Timeline indisponivel neste ambiente" eyebrow="Configuracao">
          <p>{seriesResult.message || "Supabase nao configurado."}</p>
          <p className="mt-2 text-sm text-zinc-700">A pagina permanece estavel mesmo sem variaveis de ambiente.</p>
        </SectionCard>
      ) : null}

      {seriesResult.reason === "rpc-missing" ? (
        <SectionCard title="RPCs T12 pendentes" eyebrow="Banco">
          <p>{seriesResult.message || "As RPCs de timeline/hotspots ainda nao foram aplicadas."}</p>
          <p className="mt-2 text-xs text-zinc-600">Aplique `supabase/sql/T12_timeline_hotspots.sql` no Supabase SQL Editor.</p>
        </SectionCard>
      ) : null}

      {seriesResult.reason !== "env-missing" && seriesResult.reason !== "rpc-missing" ? (
        <>
          <SectionCard title="Filtros de leitura" eyebrow={`Recorte: ${getTimeWindowLabel(days)}`}>
            <div className="space-y-3">
              <TimeWindowTabs basePath="/timeline" />
              <BucketToggle basePath="/timeline" />
              <p className="text-xs text-zinc-600">
                {neighborhood
                  ? `Bairro filtrado: ${neighborhood}`
                  : "Sem filtro de bairro. Leitura no conjunto da cidade."}
              </p>
            </div>
          </SectionCard>

          {hasSeries ? (
            <>
              <TimelineSeriesChart items={seriesResult.items} bucket={bucket} />
              <TimelineConditionChart items={conditionResult.items} bucket={bucket} />
              <HotspotsList items={hotspotsResult.items} days={days} bucket={bucket} />
              <TimelineMethodologyNote />

              <SectionCard title="Pontes de analise" eyebrow="Navegacao cruzada">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/mapa?days=${days}`}
                    className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
                  >
                    Ir para mapa
                  </Link>
                  <Link
                    href={`/territorio?days=${days}`}
                    className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
                  >
                    Ir para territorio
                  </Link>
                  <Link
                    href={`/comparativos?days=${days}&baselineDays=${days === 7 ? 30 : days === 30 ? 90 : 365}`}
                    className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
                  >
                    Ir para comparativos
                  </Link>
                  <Link
                    href="/alertas"
                    className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
                  >
                    Ir para Alertas
                  </Link>
                  <Link
                    href={`/api/exports/timeline.csv?days=${days}&bucket=${bucket}${neighborhood ? `&neighborhood=${encodeURIComponent(neighborhood)}` : ""}`}
                    className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
                  >
                    Baixar timeline.csv
                  </Link>
                </div>
              </SectionCard>
            </>
          ) : (
            <SectionCard title="Sem dados no recorte" eyebrow="Estado inicial">
              <p>{seriesResult.message || "Ainda nao ha registros publicados suficientes para montar a timeline."}</p>
            </SectionCard>
          )}
        </>
      ) : null}
    </SiteShell>
  );
}
