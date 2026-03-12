export function truncateText(text: string | null | undefined, maxLength: number): string {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
}

export function formatDatePTBR(isoDateStr: string | null | undefined): string {
    if (!isoDateStr) return "";
    try {
        const d = new Date(isoDateStr);
        // Evitando Intl e locale nativo complexo no Edge OG pra não gerar deops de memoria
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        const h = String(d.getUTCHours() - 3).padStart(2, '0'); // Fix: Hardcoded BRT pra exibir no card 
        const m = String(d.getUTCMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${h}:${m}`;
    } catch {
        return isoDateStr;
    }
}
