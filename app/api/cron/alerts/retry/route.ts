/**
 * POST /api/cron/alerts/retry
 * Requer cabecalho x-cron-secret
 */
import { NextResponse } from "next/server";
import { isAlertsCronConfigured, getAlertsCronSecret } from "@/lib/env";
import { redeliverAlertWebhooks } from "@/lib/alerts/redeliver-alert-webhooks";

export async function POST(request: Request) {
    try {
        if (!isAlertsCronConfigured()) {
            return NextResponse.json({ ok: false, message: "ALERTS_CRON_SECRET ausente" }, { status: 503 });
        }

        const secret = request.headers.get("x-cron-secret");
        if (!secret || secret !== getAlertsCronSecret()) {
            return NextResponse.json({ ok: false, message: "Não autorizado" }, { status: 401 });
        }

        let body: any = {};
        try {
            body = await request.json();
        } catch { }

        const result = await redeliverAlertWebhooks("cron", {
            asAdmin: true,
            dryRun: !!body.dryRun
        });

        if (!result.ok) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[POST /api/cron/alerts/retry]", err);
        return NextResponse.json(
            { ok: false, message: err.message || "Erro desconhecido", attempted: 0, succeeded: 0, failed: 0, skipped: 0, results: [] },
            { status: 500 }
        );
    }
}
