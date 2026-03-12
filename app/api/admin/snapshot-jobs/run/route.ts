import { NextResponse } from "next/server";

import { runSnapshotJob } from "@/lib/snapshots/run-snapshot-job";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";

    if (!jobId) {
      return NextResponse.json({ ok: false, message: "jobId e obrigatorio" }, { status: 400 });
    }

    const result = await runSnapshotJob(jobId);

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
    return NextResponse.json({ ok: false, message: "Erro interno" }, { status: 500 });
  }
}
