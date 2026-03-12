export const dynamic = "force-dynamic";

import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { listPublicSnapshotDiffs } from "@/lib/snapshots/list-public-snapshot-diffs";
import { MaterializedNote } from "@/components/snapshots/materialized-note";

export default async function MaterializedSnapshotDiffsPage() {
  const result = await listPublicSnapshotDiffs(null, 100);

  return (
    <SiteShell
      title="Diffs Congelados"
      subtitle="Comparacoes publicas entre snapshots A e B"
    >
      {!result.ok && result.reason === "env-missing" ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>{result.message}</p>
        </SectionCard>
      ) : null}

      {!result.ok && result.reason === "rpc-missing" ? (
        <SectionCard title="SQL T11b nao aplicada" eyebrow="Banco">
          <p>{result.message || "Rode T11b_materialized_snapshots.sql no Supabase SQL Editor."}</p>
        </SectionCard>
      ) : null}

      <SectionCard title="Diffs publicos" eyebrow="Estados congelados">
        {result.items.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhum diff publico ainda.</p>
        ) : (
          <div className="space-y-2">
            {result.items.map((diff) => (
              <div key={diff.id} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-4">
                <div>
                  <p className="text-sm font-medium">{diff.title || `Diff ${diff.kind}`}</p>
                  <p className="text-xs text-zinc-600">Criado em {new Date(diff.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <Link href={`/snapshots/diffs/${diff.id}`} className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">
                  Ver diff
                </Link>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <MaterializedNote type="diff" />
    </SiteShell>
  );
}
