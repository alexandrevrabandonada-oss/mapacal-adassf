"use client";

import { SectionCard } from "@/components/section-card";
import type { TimelineEntry } from "@/lib/reports/get-transparency-breakdowns";

export type TimelineListProps = {
  data: TimelineEntry[];
};

export function TimelineList({ data }: TimelineListProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Atividade recente" eyebrow="Últimos 30 dias">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {data.map((item) => (
          <div key={item.report_date} className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold">{item.report_date}</p>
              <span className="text-xs text-zinc-600">{item.count_created} enviados</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-4 bg-zinc-300 flex-1 border border-zinc-300"
              />
              <span className="w-16 text-right text-[var(--signal)]">
                {item.count_published} pub
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
