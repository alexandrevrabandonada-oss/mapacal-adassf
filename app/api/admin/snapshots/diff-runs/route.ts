import { NextResponse } from "next/server";
import { listSnapshotDiffRuns } from "@/lib/snapshots/list-snapshot-diff-runs";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    try {
        const result = await listSnapshotDiffRuns(limit);
        if (!result.ok) {
            const statusCode = result.reason === "unauthorized" ? 403 : 500;
            return NextResponse.json(result, { status: statusCode });
        }
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { ok: false, message: "Erro desconhecido" },
            { status: 500 }
        );
    }
}
