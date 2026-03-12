import { ImageResponse } from "next/og";
import { getPublicAlertById } from "@/lib/alerts/get-public-alert-by-id";
import { isSupabaseConfigured } from "@/lib/env";
import { OG_THEME } from "@/lib/og/og-theme";
import { truncateText, formatDatePTBR } from "@/lib/og/og-utils";

export const runtime = "edge";
export const alt = "Alerta - Mapa Calçadas SF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
        return new ImageResponse(<div style={{ background: "white", width: "100%", height: "100%" }}>Db Error</div>, { ...size });
    }

    const { alert: alertItem, ok } = await getPublicAlertById(id);

    if (!alertItem) {
        return new Promise((resolve) => resolve(
            new ImageResponse(
                <div style={{ background: "white", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <h1>Alerta não encontrado</h1>
                </div>,
                { ...size }
            )
        ));
    }

    const sevColor = alertItem.severity === 'high' ? OG_THEME.colors.danger.text :
        alertItem.severity === 'medium' ? OG_THEME.colors.warning.text :
            OG_THEME.colors.success.text;

    const sevBg = alertItem.severity === 'high' ? OG_THEME.colors.danger.bg :
        alertItem.severity === 'medium' ? OG_THEME.colors.warning.bg :
            OG_THEME.colors.success.bg;

    return new ImageResponse(
        (
            <div style={{
                background: OG_THEME.colors.background,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                fontFamily: OG_THEME.fonts.sans,
                padding: 64,
            }}
            >
                <div style={{ display: "flex", width: "100%", borderBottom: `4px solid ${OG_THEME.colors.primary}`, paddingBottom: 24, marginBottom: 48, justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, color: OG_THEME.colors.foreground }}>
                        MAPA CALÇADAS SF
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 600, color: OG_THEME.colors.neutral.text }}>
                        {formatDatePTBR(alertItem.created_at)}
                    </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                        <div style={{
                            background: sevBg, color: sevColor, padding: '8px 16px', borderRadius: 8, fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', border: `2px solid ${sevColor}`
                        }}>
                            {alertItem.severity === 'high' ? 'Crítico' : alertItem.severity === 'medium' ? 'Atenção' : 'Info'}
                        </div>
                        {alertItem.neighborhood && (
                            <div style={{
                                background: OG_THEME.colors.neutral.bg, color: OG_THEME.colors.neutral.text, padding: '8px 16px', borderRadius: 8, fontSize: 24, fontWeight: 'bold'
                            }}>
                                Bairro: {alertItem.neighborhood}
                            </div>
                        )}
                        <div style={{
                            background: OG_THEME.colors.neutral.bg, color: OG_THEME.colors.neutral.text, padding: '8px 16px', borderRadius: 8, fontSize: 24, fontWeight: 'bold'
                        }}>
                            {alertItem.scope === 'condition' ? `Condição: ${alertItem.condition}` : 'Escopo Geral'}
                        </div>
                    </div>

                    <h1 style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, color: OG_THEME.colors.foreground, marginBottom: 24, letterSpacing: -2 }}>
                        {truncateText(alertItem.title, 80)}
                    </h1>

                    <p style={{ fontSize: 32, color: OG_THEME.colors.neutral.text, lineHeight: 1.4, maxWidth: "90%" }}>
                        {truncateText(alertItem.summary || "Novos desvios críticos classificados pela moderação territorial automática da plataforma.", 150)}
                    </p>
                </div>

                <div style={{ display: "flex", borderTop: `1px solid ${OG_THEME.colors.neutral.border}`, paddingTop: 24, fontSize: 24, color: OG_THEME.colors.neutral.text, alignItems: "center", justifyContent: "space-between" }}>
                    <span>Monitoramento Cidadão Automático</span>
                    <span style={{ fontWeight: 'bold', color: OG_THEME.colors.primary }}>v1.0 (Alert Dispatch)</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
