/**
 * GET /api/exports/deltas.csv
 * 
 * Query params:
 * - days: 7 | 30 | 90 (current window)
 * - baselineDays: 30 | 90 | 365 (baseline window)
 * - type: condition | neighborhood
 * - neighborhood: opcional, filtra por bairro
 * 
 * Retorna CSV com deltas públicos agregados
 */
import { NextResponse } from "next/server";
import { getConditionPeriodDeltas } from "@/lib/reports/get-condition-period-deltas";
import { getNeighborhoodPeriodDeltas } from "@/lib/reports/get-neighborhood-period-deltas";

function normalizeParam(param: string | string[] | undefined | null): string | null {
  if (Array.isArray(param)) return param[0] || null;
  return param || null;
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse params
    const daysRaw = normalizeParam(searchParams.get("days"));
    const baselineDaysRaw = normalizeParam(searchParams.get("baselineDays"));
    const typeRaw = normalizeParam(searchParams.get("type"));
    const neighborhood = normalizeParam(searchParams.get("neighborhood"));

    const currentDays = daysRaw ? parseInt(daysRaw, 10) : 7;
    const baselineDays = baselineDaysRaw ? parseInt(baselineDaysRaw, 10) : 30;
    const type = typeRaw || "condition";

    if (type === "condition") {
      // CSV por condição
      const result = await getConditionPeriodDeltas(
        currentDays,
        baselineDays,
        neighborhood || undefined
      );

      if (!result.ok || result.deltas.length === 0) {
        return new NextResponse(
          "Sem dados para exportar\n",
          {
            status: 200,
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="deltas-condicao-${currentDays}d-vs-${baselineDays}d.csv"`
            }
          }
        );
      }

      // Montar CSV
      const headers = [
        "Condicao",
        "Atual (count)",
        "Base (count)",
        "Atual (por dia)",
        "Base (por dia)",
        "Delta (por dia)",
        "Variacao (%)"
      ];

      const rows = result.deltas.map((delta) => [
        `"${delta.condition}"`,
        delta.current_count,
        delta.baseline_count,
        delta.current_per_day.toFixed(2),
        delta.baseline_per_day.toFixed(2),
        delta.delta_per_day.toFixed(2),
        delta.delta_pct !== null ? delta.delta_pct.toFixed(1) : "—"
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="deltas-condicao-${currentDays}d-vs-${baselineDays}d.csv"`
        }
      });
    } else if (type === "neighborhood") {
      // CSV por bairro
      const result = await getNeighborhoodPeriodDeltas(currentDays, baselineDays);

      if (!result.ok || result.deltas.length === 0) {
        return new NextResponse(
          "Sem dados para exportar\n",
          {
            status: 200,
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="deltas-bairro-${currentDays}d-vs-${baselineDays}d.csv"`
            }
          }
        );
      }

      // Montar CSV
      const headers = [
        "Bairro",
        "Atual (count)",
        "Base (count)",
        "Atual (por dia)",
        "Base (por dia)",
        "Delta (por dia)",
        "Variacao (%)",
        "Bloqueados (atual)",
        "Verificados (atual)",
        "Com foto (atual)"
      ];

      const rows = result.deltas.map((delta) => [
        `"${delta.neighborhood}"`,
        delta.current_count,
        delta.baseline_count,
        delta.current_per_day.toFixed(2),
        delta.baseline_per_day.toFixed(2),
        delta.delta_per_day.toFixed(2),
        delta.delta_pct !== null ? delta.delta_pct.toFixed(1) : "—",
        delta.current_blocked,
        delta.current_verified,
        delta.current_with_photo
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="deltas-bairro-${currentDays}d-vs-${baselineDays}d.csv"`
        }
      });
    }

    return new NextResponse("Tipo inválido", { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return new NextResponse(`Erro: ${message}`, { status: 500 });
  }
}
