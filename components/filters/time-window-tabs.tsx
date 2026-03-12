/**
 * time-window-tabs.tsx
 * Tabs/botões para selecionar janela temporal
 * Reutilizável em /mapa, /transparencia, /territorio
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ALLOWED_TIME_WINDOWS,
  getTimeWindowLabel,
  buildTimeWindowUrl,
  normalizeTimeWindow
} from "@/lib/filters/time-window";
import type { TimeWindow } from "@/lib/filters/time-window";

export interface TimeWindowTabsProps {
  /** Path base (e.g., "/transparencia") */
  basePath: string;
  /** SearchParams atuais para preservar params adicionais */
  currentSearchParams?: Record<string, string | string[] | undefined>;
}

export function TimeWindowTabs({
  basePath
}: TimeWindowTabsProps) {
  const searchParams = useSearchParams();

  // Parse current days
  const daysParam = searchParams.get("days");
  const currentDays = normalizeTimeWindow(daysParam);

  // Rebuild additionalParams (tudo exceto 'days')
  const additionalParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "days") {
      additionalParams[key] = value;
    }
  });

  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 mb-4">
      {ALLOWED_TIME_WINDOWS.map((days: TimeWindow) => {
        const url = buildTimeWindowUrl(basePath, days, additionalParams);
        const isActive = currentDays === days;

        return (
          <Link
            key={days}
            href={url}
            className={`px-3 py-2 text-sm font-medium border transition-colors ${
              isActive
                ? "border-[var(--ink)] bg-[var(--signal)]"
                : "border-zinc-300 bg-white hover:border-[var(--ink)]"
            }`}
          >
            {getTimeWindowLabel(days)}
          </Link>
        );
      })}
    </div>
  );
}
