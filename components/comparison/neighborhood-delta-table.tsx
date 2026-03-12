"use client";

import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import type { NeighborhoodPeriodDelta } from "@/lib/reports/get-neighborhood-period-deltas";

export interface NeighborhoodDeltaTableProps {
  deltas: NeighborhoodPeriodDelta[];
  currentDays?: number;
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return "—";
  }
  return num.toFixed(2);
}

function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) {
    return "—";
  }
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function getDeltaColor(delta: number): string {
  if (delta > 0) return "text-red-600 font-semibold";
  if (delta < 0) return "text-green-600 font-semibold";
  return "text-zinc-600";
}

export function NeighborhoodDeltaTable({
  deltas,
  currentDays = 7
}: NeighborhoodDeltaTableProps) {
  if (!deltas || deltas.length === 0) {
    return (
      <SectionCard title="Deltas por Bairro" eyebrow="Cobertura territorial">
        <p className="text-sm text-zinc-600">Sem dados para comparar por bairro.</p>
      </SectionCard>
    );
  }

  // Ordenar por delta_per_day desc (maior agravamento primeiro)
  const sorted = [...deltas].sort((a, b) => {
    const aDelta = a.delta_per_day || 0;
    const bDelta = b.delta_per_day || 0;
    return bDelta - aDelta;
  });

  return (
    <SectionCard title="Deltas por Bairro" eyebrow="Cobertura territorial">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="text-left py-2 px-2 font-bold uppercase">Bairro</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Atual/dia</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Base/dia</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Delta/dia</th>
              <th className="text-right py-2 px-2 font-bold uppercase">%</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Bloqueados</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Verificados</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((delta, idx) => (
              <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 px-2">
                  <Link
                    href={`/territorio?days=${currentDays}`}
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    {delta.neighborhood}
                  </Link>
                </td>
                <td className="text-right py-2 px-2">{formatNumber(delta.current_per_day)}</td>
                <td className="text-right py-2 px-2">{formatNumber(delta.baseline_per_day)}</td>
                <td className={`text-right py-2 px-2 ${getDeltaColor(delta.delta_per_day)}`}>
                  {formatNumber(delta.delta_per_day)}
                </td>
                <td className={`text-right py-2 px-2 ${getDeltaColor(delta.delta_per_day)}`}>
                  {formatPct(delta.delta_pct)}
                </td>
                <td className="text-right py-2 px-2">{delta.current_blocked}</td>
                <td className="text-right py-2 px-2">{delta.current_verified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Tabela ordenada por maior agravamento. Clique no bairro para abrir /territorio filtrado.
      </p>
    </SectionCard>
  );
}
