import { NextResponse } from "next/server";

import { listSnapshotJobRuns } from "@/lib/snapshots/list-snapshot-job-runs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const result = await listSnapshotJobRuns(limit);

    if (!result.ok && result.reason === "unauthorized") {
      return NextResponse.json(result, { status: 403 });
    }

    if (!result.ok && result.reason === "env-missing") {
      return NextResponse.json(result, { status: 503 });
    }

    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, items: [], message: "Erro interno" }, { status: 500 });
  }
}
