/**
 * GET /api/exports/snapshot.json
 *
 * Query params:
 * - id: uuid (snapshot or diff id)
 * - type: 'snapshot' | 'diff'
 *
 * Retorna JSON público materializado de snapshot ou diff
 */
import { NextResponse } from "next/server";
import { getPublicSnapshotById } from "@/lib/snapshots/get-public-snapshot-by-id";
import { getPublicSnapshotDiffById } from "@/lib/snapshots/get-public-snapshot-diff-by-id";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "snapshot";

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Parameter 'id' is required" },
        { status: 400 }
      );
    }

    if (type === "snapshot") {
      const result = await getPublicSnapshotById(id);

      if (!result.ok || !result.snapshot) {
        return NextResponse.json(result, { status: result.reason === "not-found" ? 404 : 500 });
      }

      return NextResponse.json(
        {
          ok: true,
          type: "snapshot",
          data: result.snapshot
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="snapshot-${id}.json"`,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    } else if (type === "diff") {
      const result = await getPublicSnapshotDiffById(id);

      if (!result.ok || !result.diff) {
        return NextResponse.json(result, { status: result.reason === "not-found" ? 404 : 500 });
      }

      return NextResponse.json(
        {
          ok: true,
          type: "diff",
          data: result.diff
        },
        {
          headers: {
            "Content-Disposition": `attachment; filename="diff-${id}.json"`,
            "Content-Type": "application/json; charset=utf-8"
          }
        }
      );
    } else {
      return NextResponse.json(
        { ok: false, message: "Invalid type. Use 'snapshot' or 'diff'" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("[GET /api/exports/snapshot.json]", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
