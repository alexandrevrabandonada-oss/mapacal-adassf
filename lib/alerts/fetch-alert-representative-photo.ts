import "server-only";
import { SupabaseClient } from "@supabase/supabase-js";
import { AlertScope } from "./alert-types";

/**
 * Busca um caminho de foto (photo_public_path ou photo_private_path) 
 * que represente o alerta vindo de sidewalk_reports.
 */
export async function fetchAlertRepresentativePhoto(
    supabase: SupabaseClient,
    scope: AlertScope,
    neighborhood: string | null,
    condition: string | null
): Promise<{ path: string; isPrivate: boolean } | null> {
    try {
        let query = supabase
            .from("sidewalk_reports")
            .select("photo_public_path, photo_private_path")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(1);

        if (scope === "neighborhood" && neighborhood) {
            query = query.eq("neighborhood", neighborhood);
        } else if (scope === "condition" && condition) {
            query = query.eq("condition", condition);
        } else if (scope === "global") {
            // Pega o mais recente globalmente
        } else {
            // Se tiver info de bairro ou condição mesmo em global/outro, tenta filtrar
            if (neighborhood) query = query.eq("neighborhood", neighborhood);
            if (condition) query = query.eq("condition", condition);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            return null;
        }

        const report = data[0];
        
        if (report.photo_public_path) {
            return { path: report.photo_public_path, isPrivate: false };
        }
        
        if (report.photo_private_path) {
            return { path: report.photo_private_path, isPrivate: true };
        }

        return null;
    } catch (err) {
        console.error("[fetchAlertRepresentativePhoto] Error:", err);
        return null;
    }
}
