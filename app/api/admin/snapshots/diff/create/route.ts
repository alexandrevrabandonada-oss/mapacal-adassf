/**
 * POST /api/admin/snapshots/diff/create
 *
 * Body:
 * {
 *   fromSnapshotId: uuid,
 *   toSnapshotId: uuid,
 *   title?: string
 * }
 */
import { NextResponse } from "next/server";
import { createPublicSnapshotDiff } from "@/lib/snapshots/create-public-snapshot-diff";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromSnapshotId, toSnapshotId, title } = body;

    if (!fromSnapshotId || !toSnapshotId) {
      return NextResponse.json(
        { ok: false, message: "fromSnapshotId e toSnapshotId sao obrigatorios" },
        { status: 400 }
      );
    }

    const result = await createPublicSnapshotDiff(fromSnapshotId, toSnapshotId, title);

    if (!result.ok) {
      const statusCode = result.reason === "unauthorized" ? 403 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/admin/snapshots/diff/create]", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
