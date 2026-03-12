import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { SnapshotDiffSummary } from "@/components/snapshots/snapshot-diff-summary";
import { MaterializedNote } from "@/components/snapshots/materialized-note";
import { SharePackDrawer } from "@/components/share/share-pack-drawer";
import { getPublicSnapshotDiffById } from "@/lib/snapshots/get-public-snapshot-diff-by-id";
import { getPublicSnapshotById } from "@/lib/snapshots/get-public-snapshot-by-id";
import { getAppBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: 'Diferencial' };

  const { diff } = await getPublicSnapshotDiffById(id);

  if (!diff) return { title: 'Diff não encontrado' };

  const cleanTitle = diff.title || "Diff Congelado";
  const desc = `Comparação materializada sobre impactos na região. Registrado em ${new Date(diff.created_at).toLocaleDateString("pt-BR")}.`;
  const baseUrl = getAppBaseUrl();

  return {
    title: cleanTitle,
    description: desc,
    openGraph: {
      title: cleanTitle,
      description: desc,
      url: `${baseUrl}/snapshots/diffs/${id}`,
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

export default async function SnapshotDiffPage({ params }: PageProps) {
  const { id } = await params;
  const publicPath = `/snapshots/diffs/${id}`;

  const diffResult = await getPublicSnapshotDiffById(id);

  // Se conseguimos o diff, buscar snapshots A e B
  let fromSnapshot = null;
  let toSnapshot = null;
  if (diffResult.ok && diffResult.diff) {
    const [fr, tr] = await Promise.all([
      getPublicSnapshotById(diffResult.diff.from_snapshot_id),
      getPublicSnapshotById(diffResult.diff.to_snapshot_id)
    ]);
    if (fr.ok) fromSnapshot = fr.snapshot;
    if (tr.ok) toSnapshot = tr.snapshot;
  }

  if (!diffResult.ok || !diffResult.diff) {
    return (
      <SiteShell title="Snapshot Diff" subtitle="Comparacao Congelada">
        {diffResult.reason === "env-missing" ? (
          <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
            <p>{diffResult.message}</p>
          </SectionCard>
        ) : diffResult.reason === "rpc-missing" ? (
          <SectionCard title="SQL T11b nao aplicada" eyebrow="Configuracao">
            <p>
              Snapshots materializados ainda nao foram aplicados.
              Rode T11b_materialized_snapshots.sql no Supabase SQL Editor.
            </p>
          </SectionCard>
        ) : (
          <SectionCard title="Diff nao encontrado" eyebrow="Erro">
            <p>ID: {id}</p>
            <p className="mt-2 text-xs text-zinc-600">{diffResult.message}</p>
          </SectionCard>
        )}
      </SiteShell>
    );
  }

  const diff = diffResult.diff;

  return (
    <SiteShell title="Snapshot Diff" subtitle="Comparacao congelada entre dois snapshots">
      <div className="space-y-6">
        <SnapshotDiffSummary diff={diff} fromSnapshot={fromSnapshot} toSnapshot={toSnapshot} />

        <SectionCard title="Dados da Comparacao" eyebrow="Sumario">
          {diff.diff_data?.summary ? (
            <div className="space-y-3 text-sm">
              <div className="rounded bg-zinc-50 p-3">
                <p className="text-xs text-zinc-600">Delta de magnitude</p>
                <p className="font-mono text-lg">
                  {(diff.diff_data.summary as Record<string, unknown>).magnitude_delta !== undefined
                    ? String((diff.diff_data.summary as Record<string, unknown>).magnitude_delta)
                    : "Nao calculado"}
                </p>
              </div>
              <div className="rounded bg-zinc-50 p-3">
                <p className="text-xs text-zinc-600">Direcao</p>
                <p className="font-semibold">
                  {String((diff.diff_data.summary as Record<string, unknown>).direction || "Nao definida")}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              Dados de comparacao nao disponives. Verifique o shape dos snapshots A e B.
            </p>
          )}
        </SectionCard>

        <MaterializedNote type="diff" />

        <SectionCard title="Compartilhar" eyebrow="Links e Texto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-zinc-600">
              Gerar pacote de compartilhamento pronto para evidenciar mudanças e impactos.
            </div>
            <SharePackDrawer id={id} kind="snapshots/diffs" />
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            O diferencial captura o delta de magnitude e direção entre dois momentos registrados da plataforma.
          </p>
        </SectionCard>
      </div>
    </SiteShell>
  );
}
