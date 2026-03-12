import { SectionCard } from "@/components/section-card";
import type { TimelineConditionSeriesItem } from "@/lib/reports/get-timeline-condition-series";

type TimelineConditionChartProps = {
  items: TimelineConditionSeriesItem[];
  bucket: "day" | "week";
};

function formatBucketLabel(bucketStart: string, bucket: "day" | "week") {
  const date = new Date(bucketStart);
  return bucket === "week"
    ? `Semana ${date.toLocaleDateString("pt-BR")}`
    : date.toLocaleDateString("pt-BR");
}

export function TimelineConditionChart({ items, bucket }: TimelineConditionChartProps) {
  if (items.length === 0) {
    return null;
  }

  const groups = new Map<string, TimelineConditionSeriesItem[]>();
  for (const item of items) {
    const key = item.bucket_start;
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => (a < b ? -1 : 1));

  return (
    <SectionCard title="Ritmo por condicao" eyebrow="Good, bad e blocked ao longo do tempo">
      <div className="space-y-3">
        {sortedKeys.map((bucketStart) => {
          const bucketItems = groups.get(bucketStart) || [];
          return (
            <article key={bucketStart} className="border border-zinc-300 bg-white p-2">
              <p className="mb-2 text-xs font-semibold">{formatBucketLabel(bucketStart, bucket)}</p>
              <div className="space-y-1 text-xs">
                {bucketItems.map((item) => (
                  <div key={`${bucketStart}-${item.condition}`} className="flex items-center justify-between">
                    <span>{item.condition}</span>
                    <span>
                      {item.count} total | {item.verified_count} verificados
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}
