import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { redeliverAlertWebhooks } from "@/lib/alerts/redeliver-alert-webhooks";
import { DeliveryRetryMode } from "@/lib/alerts/delivery-retry-types";

export async function POST(request: Request) {
    try {
        const profile = await getCurrentProfile();
        if (!profile.isAuthenticated || !profile.canModerate) {
            return NextResponse.json({ ok: false, message: "Acesso negado. Apenas admins/moderadores." }, { status: 401 });
        }

        let body: any = {};
        try {
            body = await request.json();
        } catch { }

        const deliveryId = body.deliveryId as string | undefined;
        const dryRun = !!body.dryRun;

        const result = await redeliverAlertWebhooks("manual", {
            asAdmin: true,
            dryRun,
            deliveryId
        });

        if (!result.ok) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[POST /api/admin/alerts/deliver/retry]", err);
        return NextResponse.json(
            { ok: false, message: err.message || "Erro desconhecido", attempted: 0, succeeded: 0, failed: 0, skipped: 0, results: [] },
            { status: 500 }
        );
    }
}
