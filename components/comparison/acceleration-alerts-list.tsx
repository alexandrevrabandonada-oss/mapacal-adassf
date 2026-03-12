"use client";

import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import type { AccelerationAlert } from "@/lib/reports/get-acceleration-alerts";

export interface AccelerationAlertsListProps {
  alerts: AccelerationAlert[];
  currentDays?: number;
}

function formatDelta(num: number | null | undefined): string {
  if (num === null || num === undefined) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}`;
}

function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function getSeverityBadge(rank: number): string {
  if (rank <= 3) return "🔴 Crítico";
  if (rank <= 6) return "🟠 Alto";
  return "🟡 Moderado";
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

export function AccelerationAlertsList({
  alerts,
  currentDays = 7
}: AccelerationAlertsListProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <SectionCard title="Alertas de Aceleração" eyebrow="Focos de piora">
        <p className="text-sm text-zinc-600">
          Sem alertas. Nenhum par bairro-condição mostrou agravamento no período.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Alertas de Aceleração" eyebrow="Focos de piora">
      <p className="mb-4 text-xs text-zinc-600">
        Combinações bairro + condição com maior agravamento em taxa por dia:
      </p>

      <div className="space-y-3">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className="border border-zinc-200 rounded p-3 hover:bg-zinc-50 transition"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-sm">
                  {alert.neighborhood} • {getConditionLabel(alert.condition)}
                </p>
                <p className="text-xs text-zinc-500">
                  #{alert.severity_rank} - {getSeverityBadge(alert.severity_rank)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div>
                <p className="text-zinc-600">Atual</p>
                <p className="font-semibold">
                  {alert.current_per_day ? alert.current_per_day.toFixed(2) : "—"}/dia
                </p>
              </div>
              <div>
                <p className="text-zinc-600">Base</p>
                <p className="font-semibold">
                  {alert.baseline_per_day ? alert.baseline_per_day.toFixed(2) : "—"}/dia
                </p>
              </div>
              <div>
                <p className="text-zinc-600">Delta</p>
                <p className="font-semibold text-red-600">
                  {formatDelta(alert.delta_per_day)} ({formatPct(alert.delta_pct)})
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/territorio?days=${currentDays}`}
                className="text-xs underline text-blue-600 hover:text-blue-800"
              >
                Ver no territorial
              </Link>
              <Link
                href={`/mapa?days=${currentDays}`}
                className="text-xs underline text-blue-600 hover:text-blue-800"
              >
                Ver no mapa
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Clique para abrir visualizações complementares já na janela temporal atual.
      </p>
    </SectionCard>
  );
}
