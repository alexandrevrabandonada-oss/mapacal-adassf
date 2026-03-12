import { NextResponse } from "next/server";

import { isSnapshotCronConfigured, getSnapshotCronSecret } from "@/lib/env";
import { runEligibleSnapshotJobs } from "@/lib/snapshots/run-eligible-snapshot-jobs";

type CronSnapshotJobsRequest = {
    jobId?: string;
    dryRun?: boolean;
};

export async function POST(request: Request) {
    if (!isSnapshotCronConfigured()) {
        return NextResponse.json(
            { ok: false, message: "Endpoint cron indisponível. Segredo não configurado." },
            { status: 503 }
        );
    }

    const secretHeader = request.headers.get("x-cron-secret");
    if (!secretHeader || secretHeader !== getSnapshotCronSecret()) {
        return NextResponse.json(
            { ok: false, message: "Não autorizado. Token de cron inválido." },
            { status: 401 }
        );
    }

    try {
        let body: CronSnapshotJobsRequest = {};
        const text = await request.text();
        if (text) {
            body = JSON.parse(text) as CronSnapshotJobsRequest;
        }

        const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : undefined;
        const dryRun = !!body?.dryRun;

        if (dryRun) {
            // In dryRun, we just list the jobs that would be executed
            // For simplicity, we just return a message saying dry run is active.
            return NextResponse.json({
                ok: true,
                ran: 0,
                skipped: 0,
                errors: 0,
                message: "Dry run mode configurado. Nenhum job executado.",
                results: []
            });
        }

        const res = await runEligibleSnapshotJobs({ specificJobId: jobId });

        // Ensure we don't leak stack traces in HTTP errors.
        return NextResponse.json({
            ok: res.ok,
            ran: res.ran,
            skipped: res.skipped,
            errors: res.errors,
            message: res.message,
            results: res.results
        }, { status: res.ok ? 200 : 207 });
    } catch {
        return NextResponse.json(
            { ok: false, message: "Erro no processamento interno do lote." },
            { status: 500 }
        );
    }
}
