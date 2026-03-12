/**
 * GET /api/admin/alerts/webhooks/list
 */
import { NextResponse } from "next/server";
import { listWebhookDestinations } from "@/lib/alerts/list-webhook-destinations";

export async function GET() {
    try {
        const result = await listWebhookDestinations();

        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET /api/admin/alerts/webhooks/list]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
