import { NextResponse } from "next/server";
import { confirmSidewalkReport } from "@/lib/reports/confirm-report";

/**
 * POST /api/reports/confirm
 * Body: { reportId: string }
 * Retorna: { ok, message, verification_count?, is_verified?, reason? }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (typeof body !== "object" || body === null || !("reportId" in body)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Body invalido: esperado { reportId: string }",
        },
        { status: 400 },
      );
    }

    const { reportId } = body as { reportId: unknown };

    if (typeof reportId !== "string" || reportId.trim() === "") {
      return NextResponse.json(
        {
          ok: false,
          message: "reportId invalido (esperado string nao vazio)",
        },
        { status: 400 },
      );
    }

    const result = await confirmSidewalkReport(reportId);

    // se auth-required, retornar 401
    if (!result.ok && result.reason === "auth-required") {
      return NextResponse.json(result, { status: 401 });
    }

    // se not-found, retornar 404
    if (!result.ok && result.reason === "not-found") {
      return NextResponse.json(result, { status: 404 });
    }

    // outros erros ou sucesso retornam 200 com payload do resultado
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[POST /api/reports/confirm] error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Erro interno ao processar confirmacao",
      },
      { status: 500 },
    );
  }
}
