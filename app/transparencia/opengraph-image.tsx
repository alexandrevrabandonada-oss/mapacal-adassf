import { ImageResponse } from "next/og";
import { getTransparencySummary } from "@/lib/reports/get-transparency-summary";
import { isSupabaseConfigured } from "@/lib/env";
import { renderAggregateOgShell } from "@/lib/og/aggregate-og";

export const runtime = "edge";
export const alt = "Transparência Pública - Mapa Calçadas SF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG estático para /transparencia
// Nota: Search params não são repassados de forma confiável para OG estático em layouts no app router,
// então usamos um fallback institucional e tentamos ler default de 30 dias se possível.
export default async function Image() {
    if (!isSupabaseConfigured()) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Transparência Pública",
                subtitle: "Sem Conexão DB",
                description: "Ambiente não está conectado ao banco de dados para puxar o painel real.",
            }),
            { ...size }
        );
    }

    const res = await getTransparencySummary(30); // fallback default 30 days for OG
    const ok = res.ok;
    const summary = res.summary;

    if (!ok || !summary) {
        return new ImageResponse(
            renderAggregateOgShell({
                title: "Transparência Pública",
                subtitle: "Geral",
                description: "Painel público mostrando dados agregados de relatos de calçadas em San Francisco.",
            }),
            { ...size }
        );
    }

    return new ImageResponse(
        renderAggregateOgShell({
            title: "Transparência Pública",
            subtitle: "Resumo 30 Dias",
            description: "Acompanhe as estatísticas consolidadas de zeladoria, moderação e priorização cidadã nos últimos 30 dias.",
            metrics: [
                { label: "Publicados", value: summary.total_published },
                { label: "Verificados", value: summary.total_verified },
                { label: "Pendentes", value: summary.total_pending }
            ]
        }),
        { ...size }
    );
}
