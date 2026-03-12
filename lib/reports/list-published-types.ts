import type { SidewalkCondition } from "@/lib/domain/sidewalk";

export type PublicMapReportItem = {
  id: string;
  created_at: string;
  condition: SidewalkCondition;
  lat: number;
  lng: number;
  neighborhood: string | null;
  note: string | null;
  verification_count: number;
  is_verified: boolean;
};

export type PublicMapFilters = {
  condition?: SidewalkCondition;
  neighborhood?: string;
  verifiedOnly?: boolean;
};

export type ListPublishedReportsResult = {
  ok: boolean;
  items: PublicMapReportItem[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

export type GetPublishedReportByIdResult = {
  ok: boolean;
  item: PublicMapReportItem | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "not-found";
};
