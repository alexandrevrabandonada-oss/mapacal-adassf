"use client";

import { SectionCard } from "@/components/section-card";
import type { NeighborhoodBreakdown } from "@/lib/reports/get-transparency-breakdowns";

export type NeighborhoodBreakdownProps = {
  data: NeighborhoodBreakdown[];
};

export function NeighborhoodBreakdown({ data }: NeighborhoodBreakdownProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Distribuicao por bairro (top 20)" eyebrow="Breakdown">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.map((item) => (
          <div
            key={item.neighborhood}
            className="flex items-baseline justify-between border-b border-zinc-200 pb-2 text-sm"
          >
            <p className="font-semibold flex-1">{item.neighborhood}</p>
            <div className="flex gap-2 text-xs">
              <span className="w-12 text-right text-zinc-600">{item.count_total}</span>
              <span className="w-12 text-right text-[var(--signal)]">
                {item.count_published} pub
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
