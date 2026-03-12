import { ImageResponse } from "next/og";
import { getTimelineSeries } from "@/lib/reports/get-timeline-series";
import { isSupabaseConfigured } from "@/lib/env";
import { renderAggregateOgShell } from "@/lib/og/aggregate-og";
import { OG_THEME } from "@/lib/og/og-theme";

export const runtime = "edge";
export const alt = "Timeline Temporal - Mapa Calçadas SF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
    if (!isSupabaseConfigured()) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Timeline Temporal",
                subtitle: "Sem Conexão DB",
                description: "Ambiente não está conectado ao banco de dados.",
                accentColor: OG_THEME.colors.success.text
            }),
            { ...size }
        );
    }

    const { items, ok } = await getTimelineSeries(30, "day");

    if (!ok || items.length === 0) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Timeline de Ocorrências",
                subtitle: "Distribuição",
                description: "Ritmo de publicação e concentração de hotspots ao longo do tempo. Leitura cidadã estática.",
                accentColor: OG_THEME.colors.success.text
            }),
            { ...size }
        );
    }

    const points = items.length;
    const totals = items.reduce((acc, it) => acc + (it.published_count ?? 0), 0);

    return new ImageResponse(
        renderAggregateOgShell({
            title: "Timeline Histórica",
            subtitle: "Últimos 30 Dias (Diário)",
            description: `Leitura de intensidade de zeladoria distribuída pelo calendário. Total de ${totals} reportes analisáveis nesta janela.`,
            accentColor: OG_THEME.colors.success.text,
            metrics: [
                { label: "Série Temporal", value: `${points} dias` },
                { label: "Volume (Pub)", value: totals, valueColor: OG_THEME.colors.success.text }
            ]
        }),
        { ...size }
    );
}
