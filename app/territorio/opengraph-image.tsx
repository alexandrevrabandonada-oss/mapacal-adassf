import { ImageResponse } from "next/og";
import { getNeighborhoodPriorityBreakdown } from "@/lib/reports/get-neighborhood-priority-breakdown";
import { isSupabaseConfigured } from "@/lib/env";
import { renderAggregateOgShell } from "@/lib/og/aggregate-og";
import { OG_THEME } from "@/lib/og/og-theme";

export const runtime = "edge";
export const alt = "Cobertura Territorial - Mapa Calçadas SF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    if (!isSupabaseConfigured()) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Cobertura Territorial",
                subtitle: "Sem Conexão DB",
                description: "Ambiente não está conectado ao banco de dados.",
                accentColor: OG_THEME.colors.warning.text
            }),
            { ...size }
        );
    }

    const { items, ok } = await getNeighborhoodPriorityBreakdown(30); // default 30 dias

    if (!ok || items.length === 0) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Cobertura Territorial por Bairro",
                subtitle: "Visão Geral",
                description: "Onde o problema aparece com mais força. Leitura pública para puxar prioridade de rua e mutirão de bairro.",
                accentColor: OG_THEME.colors.warning.text
            }),
            { ...size }
        );
    }

    const topCount = items.length;
    const topSum = items.reduce((acc, it) => acc + it.priority_score, 0);

    return new ImageResponse(
        renderAggregateOgShell({
            title: "Prioridade por Bairro",
            subtitle: "Leitura 30 Dias",
            description: `Acompanhamento geográfico de hotspots. ${topCount} bairros mapeados com desvios urgentes no último ciclo.`,
            accentColor: OG_THEME.colors.warning.text,
            metrics: [
                { label: "Bairros Afetados", value: topCount, valueColor: OG_THEME.colors.warning.text },
                { label: "Score Total Risco", value: topSum, valueColor: OG_THEME.colors.danger.text }
            ]
        }),
        { ...size }
    );
}
