import { NextResponse } from "next/server";
import { listReportsForModeration } from "@/lib/reports/list-for-moderation";

/**
 * GET /api/reports/moderation-list?status=pending&limit=100
 * Retorna: { ok, items, message?, reason? }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    if (Number.isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        {
          ok: false,
          items: [],
          message: "limit invalido (esperado 1-1000)",
        },
        { status: 400 },
      );
    }

    const result = await listReportsForModeration(status, limit);

    // Mapear status HTTP
    if (!result.ok) {
      if (result.reason === "not-authenticated") {
        return NextResponse.json(result, { status: 401 });
      }
      if (result.reason === "permission-denied") {
        return NextResponse.json(result, { status: 403 });
      }
      // env-missing, rpc-missing, db-error → 500
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[GET /api/reports/moderation-list] error:", error);
    return NextResponse.json(
      {
        ok: false,
        items: [],
        message: "Erro interno ao listar reports",
      },
      { status: 500 },
    );
  }
}
