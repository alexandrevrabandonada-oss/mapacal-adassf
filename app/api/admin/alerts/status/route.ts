/**
 * POST /api/admin/alerts/status
 *
 * Body:
 * {
 *   alertId: string,
 *   status: 'open' | 'acknowledged' | 'dismissed'
 * }
 */
import { NextResponse } from "next/server";
import { updateAlertEventStatus } from "@/lib/alerts/update-alert-event-status";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { alertId, status } = body;

        if (!alertId || !status) {
            return NextResponse.json(
                { ok: false, message: "alertId e status são obrigatórios" },
                { status: 400 }
            );
        }

        const result = await updateAlertEventStatus(alertId, status);

        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[POST /api/admin/alerts/status]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
