import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { SnapshotSummaryCard } from "@/components/snapshots/snapshot-summary-card";
import { MaterializedNote } from "@/components/snapshots/materialized-note";
import { SharePackDrawer } from "@/components/share/share-pack-drawer";
import { getPublicSnapshotById } from "@/lib/snapshots/get-public-snapshot-by-id";
import { getPublicSnapshotRelatedDiffs } from "@/lib/snapshots/get-public-snapshot-related-diffs";
import { getAppBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { Metadata } from "next";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: 'Snapshot Transparência' };

  const { snapshot } = await getPublicSnapshotById(id);

  if (!snapshot) return { title: 'Snapshot Transparência não encontrado' };

  const cleanTitle = snapshot.title || "Snapshot Transparência";
  const desc = `Fotografia pública das condições urbanas gerada na janela de ${(snapshot.data as any)?.time_window_days || '?'} dias.`;
  const baseUrl = getAppBaseUrl();

  return {
    title: cleanTitle,
    description: desc,
    openGraph: {
      title: cleanTitle,
      description: desc,
      url: `${baseUrl}/snapshots/transparencia/${id}`,
      siteName: "Mapa Calçadas SF",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: desc,
    }
  };
}

export default async function SnapshotTransparenciaPage({ params }: PageProps) {
  const { id } = await params;
  const publicPath = `/snapshots/transparencia/${id}`;

  const result = await getPublicSnapshotById(id);

  if (!result.ok || !result.snapshot) {
    return (
      <SiteShell title="Snapshot Transparencia" subtitle="Fotografia congelada">
        {result.reason === "env-missing" ? (
          <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
            <p>{result.message}</p>
          </SectionCard>
        ) : result.reason === "rpc-missing" ? (
          <SectionCard title="SQL T11b nao aplicada" eyebrow="Configuracao">
            <p>
              Snapshots materializados ainda nao foram aplicados.
              Rode T11b_materialized_snapshots.sql no Supabase SQL Editor.
            </p>
          </SectionCard>
        ) : (
          <SectionCard title="Snapshot nao encontrado" eyebrow="Erro">
            <p>ID: {id}</p>
            <p className="mt-2 text-xs text-zinc-600">{result.message}</p>
          </SectionCard>
        )}
      </SiteShell>
    );
  }

  const snapshot = result.snapshot;
  const relatedDiffs = await getPublicSnapshotRelatedDiffs(snapshot.id);
  const nextDiffs = relatedDiffs.nextDiffs || [];
  const prevDiffs = relatedDiffs.prevDiffs || [];

  return (
    <SiteShell title="Snapshot Transparencia" subtitle="Fotografia congelada de dados agregados">
      <div className="space-y-6">
        <SnapshotSummaryCard snapshot={snapshot} />

        <SectionCard title="Dados Agregados" eyebrow="Sumario">
          {snapshot.data?.summary ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">Publicados</p>
                <p className="mt-1 text-2xl font-bold">
                  {String((snapshot.data.summary as Record<string, unknown>).total_published || 0)}
                </p>
              </div>
              <div className="rounded bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">Verificados</p>
                <p className="mt-1 text-2xl font-bold">
                  {String((snapshot.data.summary as Record<string, unknown>).total_verified || 0)}
                </p>
              </div>
              <div className="rounded bg-zinc-50 p-4">
                <p className="text-xs text-zinc-600">Bloqueados</p>
                <p className="mt-1 text-2xl font-bold">
                  {String((snapshot.data.summary as Record<string, unknown>).total_blocked || 0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Dados detalhados nao disponives. Aplique SQL T08+ para populador snapshot.</p>
          )}
        </SectionCard>

        {nextDiffs.length > 0 || prevDiffs.length > 0 ? (
          <SectionCard title="Comparacoes relacionadas" eyebrow="Historico">
            <div className="space-y-4">
              {nextDiffs.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Diffs onde este snapshot é a ORIGEM</h4>
                  <ul className="space-y-2">
                    {nextDiffs.map(d => (
                      <li key={d.id} className="text-sm">
                        <Link href={`/snapshots/diffs/${d.id}`} className="text-blue-700 hover:underline">
                          🔗 {d.title || `Diff para ${d.to_snapshot_id.substring(0, 8)}...`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {prevDiffs.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Diffs onde este snapshot é o DESTINO</h4>
                  <ul className="space-y-2">
                    {prevDiffs.map(d => (
                      <li key={d.id} className="text-sm">
                        <Link href={`/snapshots/diffs/${d.id}`} className="text-blue-700 hover:underline">
                          🔗 {d.title || `Diff a partir de ${d.from_snapshot_id.substring(0, 8)}...`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        <MaterializedNote type="snapshot" />

        <SectionCard title="Compartilhar" eyebrow="Links e Texto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-zinc-600">
              Gerar pacote de compartilhamento pronto para WhatsApp, Telegram ou Redes Sociais.
            </div>
            <SharePackDrawer id={id} kind="snapshots/transparencia" />
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Este snapshot materializado conservará estes exatos dados independente de mudanças futuras na base ativa.
          </p>
        </SectionCard>
      </div>
    </SiteShell>
  );
}
