import Link from "next/link";

import { ReportMap } from "@/components/map/report-map";
import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import { TimeWindowTabs } from "@/components/filters/time-window-tabs";
import { listPublishedReports } from "@/lib/reports/list-published";
import { getMapHotspots } from "@/lib/reports/get-map-hotspots";
import { parseTimeWindowFromSearchParams, getTimeWindowLabel } from "@/lib/filters/time-window";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MapaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseTimeWindowFromSearchParams(params);
  const hotspotMode = (Array.isArray(params.hotspots) ? params.hotspots[0] : params.hotspots) === "1";

  const [result, hotspotResult] = await Promise.all([
    listPublishedReports(),
    hotspotMode ? getMapHotspots(days) : Promise.resolve(null)
  ]);

  const mapItems = hotspotMode && hotspotResult?.ok ? hotspotResult.items : result.items;

  return (
    <SiteShell
      title="Mapa publico da cidade"
      subtitle="Mostrando apenas registros publicados. Registros enviados passam por moderacao antes de entrar no mapa."
    >
      <SectionCard title="Status do produto" eyebrow="T11 ativo">
        <ul className="space-y-2">
          <li>- Registro cidadao: ativo.</li>
          <li>- Mapa publico: ativo.</li>
          <li>- Verificacao comunitaria: ativa.</li>
          <li>- Moderacao operacional: ativa.</li>
          <li>- Foto privada: ativa.</li>
          <li>- Transparencia publica: ativa.</li>
          <li>- Cobertura territorial: ativa.</li>
          <li>- Snapshots publicos: ativos.</li>
          <li>- Comparacao entre periodos: ativa.</li>
          <li>- Timeline temporal: ativa.</li>
        </ul>
      </SectionCard>

      {result.reason !== "env-missing" && result.reason !== "rpc-missing" && result.reason !== "db-error" && (
        <SectionCard title={`Recorte temporal: ${getTimeWindowLabel(days)}`} eyebrow="Filtros temporais">
          <TimeWindowTabs basePath="/mapa" />
        </SectionCard>
      )}

      <SectionCard title="Leitura territorial" eyebrow="Ponte de prioridade">
        <p className="text-sm text-zinc-700">
          Quer entender onde comecar incidencia e mutirao? Abra o ranking por bairro e volte para este mapa com foco.
        </p>
        <Link
          href={`/territorio?days=${days}`}
          className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-bold uppercase hover:bg-white"
        >
          Ir para cobertura territorial
        </Link>
      </SectionCard>

      <SectionCard title="Dinamica de agravamento" eyebrow="Deltas entre periodos">
        <p className="text-sm text-zinc-700">
          Compare como a situacao evoluiu entre períodos. Identifique onde o problema se acelerou para priorizar ação.
        </p>
        <Link
          href={`/comparativos?days=${days}&baselineDays=${days === 7 ? 30 : days === 30 ? 90 : 365}`}
          className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
        >
          Abrir comparativos
        </Link>
      </SectionCard>

      <SectionCard title="Ritmo no tempo" eyebrow="Timeline publica">
        <p className="text-sm text-zinc-700">
          Veja quando a intensidade muda ao longo de dias e semanas, com hotspots temporais por bairro e condicao.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/timeline?days=${days}&bucket=day`}
            className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Abrir timeline
          </Link>
          <Link
            href={hotspotMode ? `/mapa?days=${days}` : `/mapa?days=${days}&hotspots=1`}
            className="inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            {hotspotMode ? "Desativar modo hotspots" : "Ativar modo hotspots"}
          </Link>
        </div>
      </SectionCard>

      {result.reason === "env-missing" ? (
        <SectionCard title="Mapa indisponivel neste ambiente" eyebrow="Configuracao">
          <p>{result.message || "Supabase nao configurado."}</p>
          <p className="mt-2">Sem env, a pagina nao quebra: apenas desativa a leitura publica.</p>
        </SectionCard>
      ) : null}

      {result.reason === "rpc-missing" ? (
        <SectionCard title="SQL T04 pendente" eyebrow="Banco">
          <p>{result.message || "A camada publica do mapa ainda nao foi aplicada no Supabase."}</p>
          <p className="mt-2">Rode `supabase/sql/T04_public_map.sql` no SQL Editor para ativar listagem publica com verificacoes.</p>
        </SectionCard>
      ) : null}

      {result.reason === "db-error" ? (
        <SectionCard title="Falha ao carregar mapa publico" eyebrow="Banco">
          <p>{result.message || "Nao foi possivel consultar os registros publicados agora."}</p>
          <p className="mt-2">A pagina segue estavel. Tente novamente apos validar o schema e as politicas no Supabase.</p>
        </SectionCard>
      ) : null}

      {result.ok && mapItems.length === 0 && !result.reason ? (
        <SectionCard title="Mapa sem pontos publicados" eyebrow="Estado vazio">
          <p>Nenhum ponto publicado ainda.</p>
          <p className="mt-2">Registros novos entram como pending. Publique manualmente no dashboard para aparecer aqui.</p>
          <Link
            href="/novo"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Criar registro
          </Link>
        </SectionCard>
      ) : null}

      {result.ok && mapItems.length > 0 ? (
        <section className="md:col-span-2">
          <ReportMap items={mapItems} />
        </section>
      ) : null}
    </SiteShell>
  );
}
