import { getPublicAlertById } from "../alerts/get-public-alert-by-id";
import { buildAlertSharePack } from "./build-alert-share-pack";
import { SharePackResult } from "./share-pack-types";
import { isSupabaseConfigured } from "@/lib/env";

export async function getAlertShareData(id: string): Promise<SharePackResult> {
    if (!isSupabaseConfigured()) {
        return { ok: false, message: "Base de dados não configurada." };
    }

    try {
        const { alert, ok, message } = await getPublicAlertById(id);
        if (!ok || !alert) {
            return { ok: false, message: message || "Alerta não encontrado." };
        }

        const data = buildAlertSharePack(alert, id);
        return { ok: true, data };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}
