import { NextResponse } from "next/server";
import { getExportPublishedReports, convertReportsToGeoJSON } from "@/lib/reports/export-published-reports";

/**
 * GET /api/exports/reports.geojson
 * Export public reports como GeoJSON, opcionalmente filtrado por dias
 * Params:
 *   - days: 7, 30, 90, 365 (default 30)
 *   - neighborhood: nome do bairro (opcional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const neighborhood = searchParams.get("neighborhood") || undefined;

    const days = daysParam ? parseInt(daysParam, 10) : 30;

    const result = await getExportPublishedReports(days, neighborhood);

    if (!result.ok || result.reason === "env-missing") {
      return NextResponse.json(
        { ok: false, message: result.message || "Export nao disponivel" },
        { status: 503 }
      );
    }

    if (result.reason === "rpc-missing") {
      return NextResponse.json(
        {
          ok: false,
          message: "RPC nao disponivel. Aplique T10_time_windows_and_snapshots.sql no Supabase SQL Editor."
        },
        { status: 500 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message || "Erro ao gerar export" },
        { status: 500 }
      );
    }

    const geojson = convertReportsToGeoJSON(result.reports);
    const filename = `relatos-calcadas-${days}d.geojson`;

    return new NextResponse(JSON.stringify(geojson), {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    console.error("[exports/reports.geojson] error:", err);
    return NextResponse.json(
      { ok: false, message: "Erro interno" },
      { status: 500 }
    );
  }
}
