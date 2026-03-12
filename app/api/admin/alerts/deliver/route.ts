/**
 * POST /api/admin/alerts/deliver
 *
 * Body:
 * {
 *   source?: "manual" | "job" | "cron",
 *   dryRun?: boolean
 * }
 */
import { NextResponse } from "next/server";
import { deliverAlertsToDestinations } from "@/lib/alerts/deliver-alerts-to-destinations";
import { DeliverAlertsMode } from "@/lib/alerts/webhook-types";

export async function POST(request: Request) {
    try {
        let body: any = {};
        try {
            body = await request.json();
        } catch {
            // Body vazio eh valido
        }

        const mode: DeliverAlertsMode = body.source || "manual";
        const dryRun = !!body.dryRun;

        const result = await deliverAlertsToDestinations(mode, { dryRun });

        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[POST /api/admin/alerts/deliver]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
