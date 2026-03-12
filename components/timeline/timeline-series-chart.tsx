import { SectionCard } from "@/components/section-card";
import type { TimelineSeriesItem } from "@/lib/reports/get-timeline-series";

type TimelineSeriesChartProps = {
  items: TimelineSeriesItem[];
  bucket: "day" | "week";
};

function formatBucketLabel(bucketStart: string, bucket: "day" | "week") {
  const date = new Date(bucketStart);
  if (bucket === "week") {
    return `Semana de ${date.toLocaleDateString("pt-BR")}`;
  }
  return date.toLocaleDateString("pt-BR");
}

function toBarWidth(value: number, maxValue: number): string {
  if (maxValue <= 0) return "0%";
  return `${Math.max((value / maxValue) * 100, 2)}%`;
}

export function TimelineSeriesChart({ items, bucket }: TimelineSeriesChartProps) {
  if (items.length === 0) {
    return null;
  }

  const maxPublished = Math.max(...items.map((item) => item.published_count), 1);

  return (
    <SectionCard title="Ritmo temporal" eyebrow="Publicados, verificados e bloqueados">
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.bucket_start} className="border border-zinc-300 bg-white p-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold">{formatBucketLabel(item.bucket_start, bucket)}</span>
              <span className="text-zinc-600">Pub: {item.published_count}</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-16">Publicados</span>
                <div className="h-3 flex-1 border border-zinc-300 bg-zinc-100">
                  <div className="h-full bg-[var(--ink)]" style={{ width: toBarWidth(item.published_count, maxPublished) }} />
                </div>
                <span className="w-8 text-right">{item.published_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16">Verificados</span>
                <div className="h-3 flex-1 border border-zinc-300 bg-zinc-100">
                  <div className="h-full bg-[var(--signal)]" style={{ width: toBarWidth(item.verified_count, maxPublished) }} />
                </div>
                <span className="w-8 text-right">{item.verified_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16">Bloqueados</span>
                <div className="h-3 flex-1 border border-zinc-300 bg-zinc-100">
                  <div className="h-full bg-[#b2452f]" style={{ width: toBarWidth(item.blocked_count, maxPublished) }} />
                </div>
                <span className="w-8 text-right">{item.blocked_count}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
