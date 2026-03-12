"use client";

import { SectionCard } from "@/components/section-card";
import type { ConditionPeriodDelta } from "@/lib/reports/get-condition-period-deltas";

export interface ConditionDeltaTableProps {
  deltas: ConditionPeriodDelta[];
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

function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    poor: "Péssima",
    bad: "Ruim",
    fair: "Regular",
    good: "Boa",
    unknown: "Desconhecida"
  };
  return labels[condition] || condition;
}

export function ConditionDeltaTable({ deltas }: ConditionDeltaTableProps) {
  if (!deltas || deltas.length === 0) {
    return (
      <SectionCard title="Deltas por Condição" eyebrow="Tipo de problema">
        <p className="text-sm text-zinc-600">Sem dados para comparar por condição.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Deltas por Condição" eyebrow="Tipo de problema">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="text-left py-2 px-2 font-bold uppercase">Condição</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Atual/dia</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Base/dia</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Delta/dia</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Variação</th>
              <th className="text-right py-2 px-2 font-bold uppercase">Verif.</th>
            </tr>
          </thead>
          <tbody>
            {deltas.map((delta, idx) => (
              <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 px-2">{getConditionLabel(delta.condition)}</td>
                <td className="text-right py-2 px-2">{formatNumber(delta.current_per_day)}</td>
                <td className="text-right py-2 px-2">{formatNumber(delta.baseline_per_day)}</td>
                <td className={`text-right py-2 px-2 ${getDeltaColor(delta.delta_per_day)}`}>
                  {formatNumber(delta.delta_per_day)}
                </td>
                <td className={`text-right py-2 px-2 ${getDeltaColor(delta.delta_per_day)}`}>
                  {formatPct(delta.delta_pct)}
                </td>
                <td className="text-right py-2 px-2">{delta.current_verified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Tabela ordenada por maior agravamento (Delta/dia desc). Vazios significam sem ocorrências no período.
      </p>
    </SectionCard>
  );
}
