import { NextRequest, NextResponse } from "next/server";
import { getSnapshotShareData } from "@/lib/share/get-snapshot-share-data";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const result = await getSnapshotShareData(id, 'snapshot_territorio');

    if (!result.ok) {
        return NextResponse.json(
            { error: result.message },
            { status: result.message?.includes("não encontrado") ? 404 : 500 }
        );
    }

    return NextResponse.json(result.data);
}
