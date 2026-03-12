/**
 * POST /api/admin/alerts/evaluate
 *
 * Body opcional:
 * {
 *   days?: number,
 *   baselineDays?: number,
 *   source?: 'manual' | 'job' | 'cron'
 * }
 */
import { NextResponse } from "next/server";
import { evaluateAlertRules } from "@/lib/alerts/evaluate-alert-rules";

export async function POST(request: Request) {
    try {
        let body: any = {};
        try {
            body = await request.json();
        } catch {
            // Ignora, body vazio eh valido
        }

        const result = await evaluateAlertRules({
            days: body.days,
            baselineDays: body.baselineDays,
            source: body.source || "manual"
        });

        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[POST /api/admin/alerts/evaluate]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
