import { getPublicSnapshotById } from "../snapshots/get-public-snapshot-by-id";
import { buildSnapshotSharePack } from "./build-snapshot-share-pack";
import { SharePackResult } from "./share-pack-types";
import { isSupabaseConfigured } from "@/lib/env";

export async function getSnapshotShareData(
    id: string,
    kind: 'snapshot_transparencia' | 'snapshot_territorio'
): Promise<SharePackResult> {
    if (!isSupabaseConfigured()) {
        return { ok: false, message: "Base de dados não configurada." };
    }

    try {
        const { snapshot, ok, message } = await getPublicSnapshotById(id);
        if (!ok || !snapshot) {
            return { ok: false, message: message || "Snapshot não encontrado." };
        }

        // Mapear share kind interno para o que o builder espera
        const builderKind = kind === 'snapshot_transparencia' ? 'snapshot_transparency' : 'snapshot_territory';
        
        const data = buildSnapshotSharePack(snapshot, builderKind);
        return { ok: true, data };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}
