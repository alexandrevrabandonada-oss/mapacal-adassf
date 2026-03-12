import { NextResponse } from "next/server";

import { runEligibleSnapshotJobs } from "@/lib/snapshots/run-eligible-snapshot-jobs";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export async function POST() {
    try {
        const profile = await getCurrentProfile();
        if (!profile.isAuthenticated || !profile.canModerate) {
            return NextResponse.json(
                { ok: false, message: "Acesso restrito a moderator/admin." },
                { status: 403 }
            );
        }

        const res = await runEligibleSnapshotJobs();

        return NextResponse.json({
            ok: res.ok,
            ran: res.ran,
            skipped: res.skipped,
            errors: res.errors,
            message: res.message,
            results: res.results
        });
    } catch {
        return NextResponse.json({ ok: false, message: "Erro interno ao executar lote" }, { status: 500 });
    }
}
