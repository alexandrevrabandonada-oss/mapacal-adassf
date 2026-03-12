export const dynamic = "force-dynamic";

import { SiteShell } from "@/components/site-shell";
import { SectionCard } from "@/components/section-card";
import { SnapshotList } from "@/components/snapshots/snapshot-list";
import { MaterializedNote } from "@/components/snapshots/materialized-note";
import { listPublicSnapshots } from "@/lib/snapshots/list-public-snapshots";

export default async function MaterializedTerritorySnapshotsPage() {
  const result = await listPublicSnapshots("territory", 100);

  return (
    <SiteShell
      title="Snapshots Materializados: Territorio"
      subtitle="Lista publica de estados congelados por ID"
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

      <SectionCard title="Snapshots publicos" eyebrow="Territorio congelado">
        <SnapshotList items={result.items} />
      </SectionCard>

      <MaterializedNote type="snapshot" />
    </SiteShell>
  );
}
