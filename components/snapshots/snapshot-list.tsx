"use client";

import Link from "next/link";
import { PublicSnapshotListItem } from "@/lib/snapshots/list-public-snapshots";

type Props = {
  items: PublicSnapshotListItem[];
  onSelect?: (id: string) => void;
};

export function SnapshotList({ items, onSelect }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        Nenhum snapshot disponivel ainda. Moderadores podem criar snapshots no painel de administracao.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const kindLabel = (kind: string) => kind === "transparency" ? "Transparencia" : "Territorio";
  const kindColor = (kind: string) => kind === "transparency" ? "text-blue-600" : "text-green-600";

  return (
    <div className="space-y-2">
      {items.map((snapshot) => (
        <div
          key={snapshot.id}
          className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${kindColor(snapshot.kind)}`}>
                  {kindLabel(snapshot.kind)}
                </span>
                <span className="text-xs text-zinc-500">Ultimos {snapshot.days} dias</span>
                {snapshot.neighborhood && (
                  <span className="text-xs text-zinc-500">{snapshot.neighborhood}</span>
                )}
              </div>
              {snapshot.title && (
                <p className="mt-1 text-sm font-medium text-zinc-900">{snapshot.title}</p>
              )}
              <p className="mt-1 text-xs text-zinc-600">
                Congelado em {formatDate(snapshot.snapshot_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/snapshots/${snapshot.kind === "transparency" ? "transparencia" : "territorio"}/${snapshot.id}`}
                className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
              >
                Ver
              </Link>
              {onSelect && (
                <button
                  onClick={() => onSelect(snapshot.id)}
                  className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
                >
                  Selecionar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
