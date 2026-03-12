import { AlertSeverity } from "@/lib/alerts/alert-types";

export function AlertBadge({ severity }: { severity: AlertSeverity }) {
    const getColors = (s: AlertSeverity) => {
        switch (s) {
            case "critical":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "high":
                return "bg-red-100 text-red-800 border-red-200";
            case "medium":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "low":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-zinc-100 text-zinc-800 border-zinc-200";
        }
    };

    const labels: Record<AlertSeverity, string> = {
        critical: "Critico",
        high: "Alto",
        medium: "Medio",
        low: "Baixo"
    };

    return (
        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${getColors(severity)}`}>
            {labels[severity] || severity}
        </span>
    );
}
