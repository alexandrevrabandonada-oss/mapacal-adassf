"use client";

import { SectionCard } from "@/components/section-card";
import type { PeriodDeltaSummary } from "@/lib/reports/get-period-delta-summary";

export interface DeltaSummaryCardsProps {
  summary: PeriodDeltaSummary | null;
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return "N/A";
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

function getDeltaColor(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return "text-zinc-600";
  
  if (delta > 0) {
    return "text-red-600 font-bold";
  } else if (delta < 0) {
    return "text-green-600 font-bold";
  }
  return "text-zinc-600";
}

export function DeltaSummaryCards({ summary }: DeltaSummaryCardsProps) {
  if (!summary) {
    return (
      <SectionCard title="Sem dados" eyebrow="Comparação">
        <p className="text-sm text-zinc-600">
          Sem dados para gerar comparação entre os períodos selecionados.
        </p>
      </SectionCard>
    );
  }

  return (
    <>
      {/* Relatos Publicados */}
      <SectionCard title="Relatos Publicados" eyebrow="Dinâmica geral">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs text-zinc-600 uppercase">Período Atual</p>
            <p className="text-lg font-bold">
              {formatNumber(summary.current_per_day)}/dia
            </p>
            <p className="text-xs text-zinc-600">
              {summary.current_published} total
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-600 uppercase">Período Base</p>
            <p className="text-lg font-bold">
              {formatNumber(summary.baseline_per_day)}/dia
            </p>
            <p className="text-xs text-zinc-600">
              {summary.baseline_published} total
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <p className={`text-sm ${getDeltaColor(summary.published_delta_per_day)}`}>
            Delta: {formatNumber(summary.published_delta_per_day)}/dia ({formatPct(summary.published_delta_pct)})
          </p>
          {summary.published_delta_pct === null && (
            <p className="mt-1 text-xs text-zinc-500">
              *Sem baseline: não é possível calcular % confiável
            </p>
          )}
        </div>
      </SectionCard>

      {/* Relatos Verificados */}
      <SectionCard title="Relatos Verificados" eyebrow="Qualidade">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs text-zinc-600 uppercase">Período Atual</p>
            <p className="text-lg font-bold">
              {formatNumber(summary.verified_delta_per_day)}/dia
            </p>
            <p className="text-xs text-zinc-600">
              {summary.current_verified} total
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-600 uppercase">Período Base</p>
            <p className="text-lg font-bold">
              {formatNumber(summary.baseline_per_day)}/dia
            </p>
            <p className="text-xs text-zinc-600">
              {summary.baseline_verified} total
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <p className={`text-sm ${getDeltaColor(summary.verified_delta_per_day)}`}>
            Delta: {formatNumber(summary.verified_delta_per_day)}/dia ({formatPct(summary.verified_delta_pct)})
          </p>
        </div>
      </SectionCard>

      {/* Relatos Bloqueados */}
      <SectionCard title="Relatos Bloqueados" eyebrow="Moderação">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs text-zinc-600 uppercase">Período Atual</p>
            <p className="text-lg font-bold">
              {formatNumber(summary.blocked_delta_per_day)}/dia
            </p>
            <p className="text-xs text-zinc-600">
              {summary.current_blocked} total
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-600 uppercase">Período Base</p>
            <p className="text-lg font-bold">
              {formatNumber(summary.baseline_per_day)}/dia
            </p>
            <p className="text-xs text-zinc-600">
              {summary.baseline_blocked} total
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <p className={`text-sm ${getDeltaColor(summary.blocked_delta_per_day)}`}>
            Delta: {formatNumber(summary.blocked_delta_per_day)}/dia ({formatPct(summary.blocked_delta_pct)})
          </p>
        </div>
      </SectionCard>
    </>
  );
}
