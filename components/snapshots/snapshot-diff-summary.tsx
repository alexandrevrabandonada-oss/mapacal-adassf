import { PublicSnapshotDiffData } from "@/lib/snapshots/get-public-snapshot-diff-by-id";
import { PublicSnapshotData } from "@/lib/snapshots/get-public-snapshot-by-id";
import Link from "next/link";

type Props = {
  diff: PublicSnapshotDiffData;
  fromSnapshot?: PublicSnapshotData | null;
  toSnapshot?: PublicSnapshotData | null;
};

export function SnapshotDiffSummary({ diff, fromSnapshot, toSnapshot }: Props) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const note = typeof diff.diff_data?.comparison_note === "string"
    ? diff.diff_data.comparison_note
    : null;

  const kindColor = diff.kind === "transparency"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-green-50 text-green-700 border-green-200";

  return (
    <div className={`rounded-lg border ${kindColor} p-6`}>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Diff Congelado</p>
        <h1 className="mt-1 text-2xl font-bold">{diff.title || `Comparacao ${diff.kind}`}</h1>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded bg-white/50 p-3">
            <p className="text-xs opacity-70">Snapshot A (De)</p>
            {fromSnapshot ? (
              <p className="font-medium">
                <Link href={`/snapshots/${diff.kind === "transparency" ? "transparencia" : "territorio"}/${fromSnapshot.id}`} className="hover:underline">
                  {fromSnapshot.title || `${fromSnapshot.days}d snapshot`}
                </Link>
                <span className="ml-1 text-xs opacity-70">{formatDate(fromSnapshot.snapshot_at)}</span>
              </p>
            ) : (
              <p className="text-sm text-zinc-500">ID: {diff.from_snapshot_id}</p>
            )}
          </div>

          <div className="rounded bg-white/50 p-3">
            <p className="text-xs opacity-70">Snapshot B (Para)</p>
            {toSnapshot ? (
              <p className="font-medium">
                <Link href={`/snapshots/${diff.kind === "transparency" ? "transparencia" : "territorio"}/${toSnapshot.id}`} className="hover:underline">
                  {toSnapshot.title || `${toSnapshot.days}d snapshot`}
                </Link>
                <span className="ml-1 text-xs opacity-70">{formatDate(toSnapshot.snapshot_at)}</span>
              </p>
            ) : (
              <p className="text-sm text-zinc-500">ID: {diff.to_snapshot_id}</p>
            )}
          </div>
        </div>

        {note ? <p className="text-sm opacity-80">{note}</p> : null}
      </div>
    </div>
  );
}
