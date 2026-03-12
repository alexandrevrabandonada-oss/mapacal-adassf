"use client";

import { SectionCard } from "@/components/section-card";

export interface ExportPanelProps {
  days?: number;
  neighborhood?: string;
}

export function ExportPanel({ days = 30, neighborhood }: ExportPanelProps) {
  const csvParams = new URLSearchParams();
  csvParams.set("days", String(days));
  if (neighborhood) csvParams.set("neighborhood", neighborhood);

  const geojsonParams = new URLSearchParams();
  geojsonParams.set("days", String(days));
  if (neighborhood) geojsonParams.set("neighborhood", neighborhood);

  const csvUrl = `/api/exports/reports.csv?${csvParams.toString()}`;
  const geojsonUrl = `/api/exports/reports.geojson?${geojsonParams.toString()}`;

  return (
    <SectionCard title="Exportacoes publicas" eyebrow="Download">
      <p className="mb-4 text-sm text-zinc-700">
        Baixe dados de relatos publicados em formato aberto para analise independente, pesquisa academica ou incidencia publica.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={csvUrl}
          download={`relatos-calcadas-${days}d.csv`}
          className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
        >
          ↓ CSV
        </a>
        <a
          href={geojsonUrl}
          download={`relatos-calcadas-${days}d.geojson`}
          className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
        >
          ↓ GeoJSON
        </a>
      </div>
    </SectionCard>
  );
}
