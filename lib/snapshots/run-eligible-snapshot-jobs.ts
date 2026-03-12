import "server-only";

import { listSnapshotJobs } from "./list-snapshot-jobs";
import { runSnapshotJob, RunSnapshotJobResult } from "./run-snapshot-job";

export type RunEligibleSnapshotJobsResult = {
    ok: boolean;
    total: number;
    ran: number;
    skipped: number;
    errors: number;
    message: string;
    results: Array<{
        jobId: string;
        result: RunSnapshotJobResult;
    }>;
};

export async function runEligibleSnapshotJobs(options?: { specificJobId?: string }): Promise<RunEligibleSnapshotJobsResult> {
    const listRes = await listSnapshotJobs({ asAdmin: true });

    if (!listRes.ok) {
        return {
            ok: false,
            total: 0,
            ran: 0,
            skipped: 0,
            errors: 0,
            message: `Falha ao listar jobs: ${listRes.message}`,
            results: []
        };
    }

    let jobs = listRes.items.filter((j) => j.is_enabled);

    if (options?.specificJobId) {
        jobs = jobs.filter((j) => j.id === options.specificJobId);
        if (jobs.length === 0) {
            return {
                ok: false,
                total: 0,
                ran: 0,
                skipped: 0,
                errors: 0,
                message: `Job especifico nao encontrado ou inativo: ${options.specificJobId}`,
                results: []
            };
        }
    }

    if (jobs.length === 0) {
        return {
            ok: true,
            total: 0,
            ran: 0,
            skipped: 0,
            errors: 0,
            message: "Nenhum job elegivel encontrado ou ativos.",
            results: []
        };
    }

    let ran = 0;
    let skipped = 0;
    let errors = 0;
    const results: Array<{ jobId: string; result: RunSnapshotJobResult }> = [];

    for (const job of jobs) {
        try {
            const res = await runSnapshotJob(job.id, { asAdmin: true });
            results.push({ jobId: job.id, result: res });

            if (!res.ok) {
                errors++;
            } else if (res.status === "skipped") {
                skipped++;
            } else {
                ran++;
            }
        } catch (e: any) {
            errors++;
            const errorMessage = e instanceof Error ? e.message : "Erro desconhecido na execucao";
            results.push({
                jobId: job.id,
                result: {
                    ok: false,
                    status: "error",
                    snapshotId: null,
                    message: errorMessage
                }
            });
        }
    }

    const ok = errors === 0;

    return {
        ok,
        total: jobs.length,
        ran,
        skipped,
        errors,
        message: ok
            ? `Concluido. ${ran} executados, ${skipped} pulados.`
            : `Concluido com ${errors} erros. ${ran} executados, ${skipped} pulados.`,
        results
    };
}
