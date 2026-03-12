import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ExportPublishedReport = {
  id: string;
  created_at: string;
  condition: string;
  neighborhood: string | null;
  note: string | null;
  lat: number;
  lng: number;
  verification_count: number;
  is_verified: boolean;
  has_photo: boolean;
};

export type GetExportPublishedReportsResult = {
  ok: boolean;
  reports: ExportPublishedReport[];
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error";
};

function mapRpcErrorMessage(errorCode?: string): "rpc-missing" | "db-error" {
  if (errorCode === "42883") {
    return "rpc-missing";
  }
  return "db-error";
}

export async function getExportPublishedReports(
  days: number = 30,
  neighborhood?: string
): Promise<GetExportPublishedReportsResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      reports: [],
      reason: "env-missing",
      message: "Supabase nao configurado. Export indisponivel neste ambiente."
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return {
        ok: false,
        reports: [],
        reason: "env-missing",
        message: "Cliente Supabase nao disponivel"
      };
    }

    const { data, error } = await supabase.rpc("get_export_published_reports", {
      in_days: days,
      in_neighborhood: neighborhood || null
    });

    if (error) {
      const reason = mapRpcErrorMessage(error.code);
      return {
        ok: false,
        reports: [],
        reason,
        message: reason === "rpc-missing"
          ? "RPC nao disponivel. Aplique T08_transparency_exports.sql no Supabase."
          : `Erro ao buscar reports: ${error.message}`
      };
    }

    type RpcResult = {
      id: string;
      created_at: string;
      condition: string;
      neighborhood: string | null;
      note: string | null;
      lat: number;
      lng: number;
      verification_count: number;
      is_verified: boolean;
      has_photo: boolean;
    };

    const reports: ExportPublishedReport[] = (data as RpcResult[] || []).map((item) => ({
      id: item.id,
      created_at: item.created_at,
      condition: item.condition,
      neighborhood: item.neighborhood,
      note: item.note,
      lat: item.lat,
      lng: item.lng,
      verification_count: item.verification_count,
      is_verified: item.is_verified,
      has_photo: item.has_photo
    }));

    return {
      ok: true,
      reports,
      message: "Reports para export obtidos com sucesso"
    };
  } catch (err) {
    console.error("[getExportPublishedReports] error:", err);
    return {
      ok: false,
      reports: [],
      reason: "db-error",
      message: "Erro interno ao buscar reports para export"
    };
  }
}

/**
 * Converte reports para CSV
 */
export function convertReportsToCSV(reports: ExportPublishedReport[]): string {
  const headers = [
    "id",
    "created_at",
    "condition",
    "neighborhood",
    "note",
    "lat",
    "lng",
    "verification_count",
    "is_verified",
    "has_photo"
  ];

  const csvHeaders = headers.join(",");

  const csvRows = reports.map((report) => {
    const values = [
      report.id,
      report.created_at,
      report.condition,
      report.neighborhood || "",
      `"${(report.note || "").replace(/"/g, '""')}"`, // Escape quotes
      report.lat,
      report.lng,
      report.verification_count,
      report.is_verified ? "yes" : "no",
      report.has_photo ? "yes" : "no"
    ];
    return values.join(",");
  });

  return `${csvHeaders}\n${csvRows.join("\n")}`;
}

/**
 * Converte reports para GeoJSON FeatureCollection
 */
export function convertReportsToGeoJSON(reports: ExportPublishedReport[]): {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: Record<string, string | number | boolean | null>;
  }>;
} {
  const features = reports.map((report) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [report.lng, report.lat] as [number, number]
    },
    properties: {
      id: report.id,
      created_at: report.created_at,
      condition: report.condition,
      neighborhood: report.neighborhood,
      note: report.note,
      verification_count: report.verification_count,
      is_verified: report.is_verified,
      has_photo: report.has_photo
    }
  }));

  return {
    type: "FeatureCollection",
    features
  };
}
