/**
 * GET /api/admin/alerts/deliveries/list
 */
import { NextResponse } from "next/server";
import { listAlertDeliveries } from "@/lib/alerts/list-alert-deliveries";

export async function GET() {
    try {
        const result = await listAlertDeliveries();

        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[GET /api/admin/alerts/deliveries/list]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
