"use client";

import dynamic from "next/dynamic";

import type { PublicMapReportItem } from "@/lib/reports/list-published-types";

const ReportMapClient = dynamic(() => import("./report-map-client").then((mod) => mod.ReportMapClient), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-60 items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper)] p-4 text-sm font-semibold">
      Carregando mapa...
    </div>
  )
});

type ReportMapProps = {
  items: PublicMapReportItem[];
};

export function ReportMap({ items }: ReportMapProps) {
  return <ReportMapClient initialItems={items} />;
}
