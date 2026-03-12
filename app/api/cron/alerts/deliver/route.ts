/**
 * POST /api/cron/alerts/deliver
 * 
 * Requer cabecalho de autenticao:
 * x-cron-secret: [ALERTS_CRON_SECRET]
 */
import { NextResponse } from "next/server";
import { isAlertsCronConfigured, getAlertsCronSecret } from "@/lib/env";
import { deliverAlertsToDestinations } from "@/lib/alerts/deliver-alerts-to-destinations";

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
        } catch {
            // Body vazio é válido para default
        }

        const result = await deliverAlertsToDestinations("cron", {
            asAdmin: true,
            dryRun: !!body.dryRun
        });

        if (!result.ok) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[POST /api/cron/alerts/deliver]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
