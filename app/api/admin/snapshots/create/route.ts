/**
 * POST /api/admin/snapshots/create
 *
 * Body:
 * {
 *   kind: 'transparency' | 'territory',
 *   days: 7 | 30 | 90 | 365,
 *   title?: string,
 *   autoDiff?: boolean
 * }
 */
import { NextResponse } from "next/server";
import { createPublicSnapshot } from "@/lib/snapshots/create-public-snapshot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kind, days, neighborhood, title, autoDiff } = body;

    if (!kind || !days) {
      return NextResponse.json(
        { ok: false, message: "kind e days sao obrigatorios" },
        { status: 400 }
      );
    }

    const result = await createPublicSnapshot(kind, days, neighborhood, title, {
      autoDiff: autoDiff !== false, // default true
      source: "manual"
    });

    if (!result.ok) {
      const statusCode = result.reason === "unauthorized" ? 403 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/snapshots/create]", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
