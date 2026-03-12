import { NextResponse } from "next/server";
import { moderateSidewalkReport } from "@/lib/reports/moderate-report";

/**
 * POST /api/reports/moderate
 * Body: { reportId: string, action: "publish" | "hide" | "request_review", reason?: string }
 * Retorna: { ok, message, newStatus?, reason? }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        {
          ok: false,
          message: "Body invalido: esperado objeto JSON",
        },
        { status: 400 },
      );
    }

    const { reportId, action, reason } = body as {
      reportId: unknown;
      action: unknown;
      reason?: unknown;
    };

    if (typeof reportId !== "string" || reportId.trim() === "") {
      return NextResponse.json(
        {
          ok: false,
          message: "reportId invalido (esperado string nao vazio)",
        },
        { status: 400 },
      );
    }

    if (!action || !["publish", "hide", "request_review"].includes(action as string)) {
      return NextResponse.json(
        {
          ok: false,
          message: "action invalido: esperado publish, hide ou request_review",
        },
        { status: 400 },
      );
    }

    const reasonStr = typeof reason === "string" ? reason : undefined;

    const result = await moderateSidewalkReport(
      reportId,
      action as "publish" | "hide" | "request_review",
      reasonStr,
    );

    // Mapear status HTTP
    if (!result.ok) {
      if (result.reason === "not-authenticated") {
        return NextResponse.json(result, { status: 401 });
      }
      if (result.reason === "permission-denied") {
        return NextResponse.json(result, { status: 403 });
      }
      if (result.reason === "not-found") {
        return NextResponse.json(result, { status: 404 });
      }
      // env-missing, rpc-missing, invalid-action, db-error → 500 ou 200 com ok=false
      return NextResponse.json(result, { status: result.reason === "invalid-action" ? 400 : 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[POST /api/reports/moderate] error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Erro interno ao processar moderacao",
      },
      { status: 500 },
    );
  }
}
