/**
 * GET /api/admin/snapshots/diffs/list
 *
 * Query params:
 * - kind?: 'transparency' | 'territory'
 * - limit?: number (default 50)
 */
import { NextResponse } from "next/server";
import { listPublicSnapshotDiffs } from "@/lib/snapshots/list-public-snapshot-diffs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") as "transparency" | "territory" | null;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const result = await listPublicSnapshotDiffs(kind, limit);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/admin/snapshots/diffs/list]", err);
    return NextResponse.json(
      { ok: false, items: [], message: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
