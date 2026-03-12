import { PublicSnapshotData } from "@/lib/snapshots/get-public-snapshot-by-id";

type Props = {
  snapshot: PublicSnapshotData;
};

export function SnapshotSummaryCard({ snapshot }: Props) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const kindLabel = snapshot.kind === "transparency" ? "Transparencia" : "Territorio";
  const kindColor = snapshot.kind === "transparency" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200";
  const metadata = snapshot.data && typeof snapshot.data === "object"
    ? (snapshot.data as Record<string, unknown>).metadata
    : null;
  const description = metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>).description
    : null;

  return (
    <div className={`rounded-lg border ${kindColor} p-6`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Snapshot Materializado</p>
          <h1 className="mt-1 text-2xl font-bold">
            {snapshot.title || kindLabel}
          </h1>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium">
          {snapshot.days}d
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs opacity-70">Tipo</p>
          <p className="font-semibold">{kindLabel}</p>
        </div>
        <div>
          <p className="text-xs opacity-70">Congelado em</p>
          <p className="font-semibold text-sm">{formatDate(snapshot.snapshot_at)}</p>
        </div>
        {snapshot.neighborhood && (
          <div>
            <p className="text-xs opacity-70">Bairro</p>
            <p className="font-semibold">{snapshot.neighborhood}</p>
          </div>
        )}
      </div>

      {typeof description === "string" && description ? (
        <p className="mt-4 text-sm opacity-80">
          {description}
        </p>
      ) : null}
    </div>
  );
}
