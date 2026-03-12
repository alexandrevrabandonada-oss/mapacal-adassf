/**
 * share-snapshot-panel.tsx
 * Painel para compartilhar link do snapshot público
 * Mostra URL compartilhável e botão de copiar
 */

"use client";

import { useState } from "react";
import { getTimeWindowLabel, type TimeWindow } from "@/lib/filters/time-window";

export interface ShareSnapshotPanelProps {
  /** URL pública para compartilhar (e.g., "https://example.com/snapshots/transparencia?days=30") */
  snapshotUrl: string;
  /** Dias do período (7, 30, 90, 365) */
  days: TimeWindow;
}

export function ShareSnapshotPanel({
  snapshotUrl,
  days
}: ShareSnapshotPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snapshotUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar link:", err);
    }
  };

  return (
    <div className="border-2 border-zinc-300 bg-zinc-50 p-3 rounded">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase">Compartilhar recorte</h4>
        <span className="text-xs text-zinc-600">{getTimeWindowLabel(days)}</span>
      </div>

      <p className="mb-3 text-xs text-zinc-600">
        Este link congela o recorte temporal atual. Dados atualizados permanecem públicos; apenas a janela de tempo é estável.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={snapshotUrl}
          className="flex-1 px-2 py-1 text-xs border border-zinc-300 bg-white rounded font-mono"
        />
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs font-bold bg-[var(--ink)] text-white border border-[var(--ink)] rounded hover:bg-white hover:text-[var(--ink)] transition-colors"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
