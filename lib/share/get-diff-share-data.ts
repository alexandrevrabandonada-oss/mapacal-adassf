import { getPublicSnapshotDiffById } from "../snapshots/get-public-snapshot-diff-by-id";
import { buildDiffSharePack } from "./build-diff-share-pack";
import { SharePackResult } from "./share-pack-types";
import { isSupabaseConfigured } from "@/lib/env";

export async function getDiffShareData(id: string): Promise<SharePackResult> {
    if (!isSupabaseConfigured()) {
        return { ok: false, message: "Base de dados não configurada." };
    }

    try {
        const { diff, ok, message } = await getPublicSnapshotDiffById(id);
        if (!ok || !diff) {
            return { ok: false, message: message || "Diff não encontrado." };
        }

        const data = buildDiffSharePack(diff);
        return { ok: true, data };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}
