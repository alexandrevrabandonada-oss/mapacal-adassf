import { NextResponse } from "next/server";

import { listSnapshotJobs } from "@/lib/snapshots/list-snapshot-jobs";

export async function GET() {
  try {
    const result = await listSnapshotJobs();

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
