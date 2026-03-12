/**
 * POST /api/admin/snapshots/auto-diff
 *
 * Body:
 * {
 *   snapshotId: uuid
 * }
 */
import { NextResponse } from "next/server";
import { createAutoDiffForSnapshot } from "@/lib/snapshots/create-auto-diff-for-snapshot";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { snapshotId } = body;

        if (!snapshotId) {
            return NextResponse.json(
                { ok: false, message: "snapshotId é obrigatorio" },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get("authorization");
        const isServiceRole = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

        const result = await createAutoDiffForSnapshot(snapshotId, {
            source: "manual",
            asAdmin: isServiceRole
        });

        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("[POST /api/admin/snapshots/auto-diff]", err);
        return NextResponse.json(
            { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
            { status: 500 }
        );
    }
}
