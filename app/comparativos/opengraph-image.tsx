import { ImageResponse } from "next/og";
import { getPeriodDeltaSummary } from "@/lib/reports/get-period-delta-summary";
import { isSupabaseConfigured } from "@/lib/env";
import { renderAggregateOgShell } from "@/lib/og/aggregate-og";

export const runtime = "edge";
export const alt = "Comparação - Mapa Calçadas SF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    if (!isSupabaseConfigured()) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Comparativos",
                subtitle: "Sem Conexão DB",
                description: "Ambiente não está conectado ao banco de dados.",
            }),
            { ...size }
        );
    }

    const { summary, ok } = await getPeriodDeltaSummary(30, 90);

    if (!ok || !summary) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Comparação entre Períodos",
                subtitle: "Zeladoria em Perspectiva",
                description: "Dinâmica de agravamento e melhora entre períodos lendo taxas metodológicas normalizadas."
            }),
            { ...size }
        );
    }

    const dirRaw = String(((summary as unknown) as Record<string, unknown>).direction || "Estável");
    const dir = dirRaw === "Piora Acelerada" || dirRaw === "Piora Leve" ? "Piora" :
                dirRaw === "Melhora Clara" || dirRaw === "Melhora Leve" ? "Melhora" : "Misto/Estável";

    return new ImageResponse(
        renderAggregateOgShell({
            title: "Deltas: 30D vs 90D",
            subtitle: "Tendência Recente",
            description: "Avaliação do ritmo de reportes e variação de taxas por dia entre os dois períodos mais recentes na escala mensal vs trimestral.",
            metrics: [
                { label: "Direção Global", value: dir },
                { label: "Variação/Dia", value: String(summary.published_delta_per_day > 0 ? `+${summary.published_delta_per_day.toFixed(1)}` : summary.published_delta_per_day?.toFixed(1) || 0) }
            ]
        }),
        { ...size }
    );
}
