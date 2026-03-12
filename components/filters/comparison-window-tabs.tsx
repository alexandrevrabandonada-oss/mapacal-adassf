"use client";

import Link from "next/link";
import {
  ALLOWED_CURRENT_WINDOWS,
  ALLOWED_BASELINE_WINDOWS,
  type CurrentWindow,
  type BaselineWindow,
  getComparisonLabel
} from "@/lib/filters/comparison-window";

export interface ComparisonWindowTabsProps {
  currentDays: CurrentWindow;
  baselineDays: BaselineWindow;
  baseUrl: string;
  /**
   * Outros params para preservar (ex: neighborhood)
   * Será incluído nas URLs dos links
   */
  additionalParams?: Record<string, string>;
}

export function ComparisonWindowTabs({
  currentDays,
  baselineDays,
  baseUrl,
  additionalParams
}: ComparisonWindowTabsProps) {
  const buildUrl = (current: CurrentWindow, baseline: BaselineWindow): string => {
    const url = new URL(baseUrl, "http://localhost");
    url.searchParams.set("days", String(current));
    url.searchParams.set("baselineDays", String(baseline));

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }

    return url.pathname + url.search;
  };

  // Gerar todas as combinações válidas
  const validPairs: Array<[CurrentWindow, BaselineWindow]> = [];
  for (const current of ALLOWED_CURRENT_WINDOWS) {
    for (const baseline of ALLOWED_BASELINE_WINDOWS) {
      if (baseline > current) {
        validPairs.push([current, baseline]);
      }
    }
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {validPairs.map(([current, baseline]) => {
        const isActive = currentDays === current && baselineDays === baseline;
        const label = getComparisonLabel(current, baseline);

        return (
          <Link
            key={`${current}vs${baseline}`}
            href={buildUrl(current, baseline)}
            className={`px-3 py-2 text-xs font-bold uppercase rounded border-2 transition ${
              isActive
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-[var(--ink)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
