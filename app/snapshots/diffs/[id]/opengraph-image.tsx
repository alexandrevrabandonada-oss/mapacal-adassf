import { ImageResponse } from "next/og";
import { getPublicSnapshotDiffById } from "@/lib/snapshots/get-public-snapshot-diff-by-id";
import { isSupabaseConfigured } from "@/lib/env";
import { OG_THEME } from "@/lib/og/og-theme";
import { truncateText, formatDatePTBR } from "@/lib/og/og-utils";

export const runtime = "edge";
export const alt = "Comparação e Diferencial - Mapa Calçadas SF";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
        return new ImageResponse(<div style={{ background: "white", width: "100%", height: "100%" }}>Db Error</div>, { ...size });
    }

    const { diff, ok } = await getPublicSnapshotDiffById(id);

    if (!ok || !diff) {
        return new ImageResponse(
            <div style={{ background: "white", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h1>Diff não encontrado</h1>
            </div>,
            { ...size }
        );
    }

    const { diff_data } = diff;
    const metrics = diff_data?.summary as any;

    return new ImageResponse(
        (
            <div style={{ background: OG_THEME.colors.background, width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: OG_THEME.fonts.sans, padding: 64 }}>
                <div style={{ display: "flex", width: "100%", borderBottom: `4px solid ${OG_THEME.colors.primary}`, paddingBottom: 24, marginBottom: 48, justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, color: OG_THEME.colors.foreground }}>
                        MAPA CALÇADAS SF
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 600, color: OG_THEME.colors.neutral.text }}>
                        {formatDatePTBR(diff.created_at)}
                    </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                        <div style={{ background: OG_THEME.colors.primary, color: OG_THEME.colors.white, padding: '8px 16px', borderRadius: 8, fontSize: 24, fontWeight: 'bold' }}>
                            Diff Congelado
                        </div>
                        <div style={{ background: OG_THEME.colors.success.bg, color: OG_THEME.colors.success.text, padding: '8px 16px', borderRadius: 8, fontSize: 24, fontWeight: 'bold' }}>
                            Tipo: {String((diff as any).kind) === 'automation' ? 'Automático' : 'Manual'}
                        </div>
                    </div>

                    <h1 style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, color: OG_THEME.colors.foreground, marginBottom: 24, letterSpacing: -2 }}>
                        {truncateText(diff.title || "Comparação Materializada", 80)}
                    </h1>

                    {metrics ? (
                        <div style={{ display: "flex", gap: 32, marginTop: 16 }}>
                            <div style={{ display: "flex", flex: 1, flexDirection: "column", background: OG_THEME.colors.neutral.bg, padding: 24, borderRadius: 16, border: `2px solid ${OG_THEME.colors.neutral.border}` }}>
                                <span style={{ fontSize: 24, color: OG_THEME.colors.neutral.text, fontWeight: 'bold' }}>Direção</span>
                                <span style={{ fontSize: 48, fontWeight: '900', color: OG_THEME.colors.primary, marginTop: 8 }}>{metrics.direction || "Nenhuma"}</span>
                            </div>
                        </div>
                    ) : (
                        <p style={{ fontSize: 32, color: OG_THEME.colors.neutral.text }}>
                            Análise comparativa congelada sobre métricas selecionáveis.
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", borderTop: `1px solid ${OG_THEME.colors.neutral.border}`, paddingTop: 24, fontSize: 24, color: OG_THEME.colors.neutral.text }}>
                    Registro congelado — Independente de banco de dados ativo.
                </div>
            </div>
        ),
        { ...size }
    );
}
