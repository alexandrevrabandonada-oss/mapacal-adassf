"use client";

import { SectionCard } from "@/components/section-card";
import type { ConditionBreakdown } from "@/lib/reports/get-transparency-breakdowns";

export type ConditionBreakdownProps = {
  data: ConditionBreakdown[];
};

const CONDITION_LABELS: Record<string, string> = {
  good: "Boa",
  bad: "Ruim",
  blocked: "Bloqueada"
};

export function ConditionBreakdown({ data }: ConditionBreakdownProps) {
  if (data.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...data.map(d => d.count_total), 1);

  return (
    <SectionCard title="Distribuicao por condicao" eyebrow="Breakdown">
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.condition}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-sm font-semibold">
                {CONDITION_LABELS[item.condition] || item.condition}
              </p>
              <p className="text-xs text-zinc-600">{item.count_total} relatos</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 border border-zinc-300 bg-zinc-100 h-6 relative">
                <div
                  className="h-full bg-[var(--signal)]"
                  style={{
                    width: `${(item.count_published / maxTotal) * 100}%`
                  }}
                />
              </div>
              <span className="w-12 text-right">{item.count_published} pub</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
