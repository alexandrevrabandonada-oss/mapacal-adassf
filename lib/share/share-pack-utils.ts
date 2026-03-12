import { getAppBaseUrl } from "@/lib/env";

/**
 * Constrói uma URL absoluta a partir de um path relativo.
 */
export function buildAbsoluteUrl(path: string): string {
    const baseUrl = getAppBaseUrl();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
}

/**
 * Constrói uma URL de compartilhamento para WhatsApp.
 */
export function buildWhatsappUrl(text: string, url: string): string {
    const fullText = `${text}\n\n${url}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
}

/**
 * Trunca um texto de forma segura para redes sociais.
 */
export function truncateForShare(text: string, maxLength: number = 200): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
}

/**
 * Formata data curta para o SharePack.
 */
export function formatShortDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}
