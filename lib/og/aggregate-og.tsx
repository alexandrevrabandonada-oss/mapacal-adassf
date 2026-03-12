import { OG_THEME } from "./og-theme";
import { truncateText } from "./og-utils";

export type BaseAggregateOgProps = {
    title: string;
    subtitle: string;
    description: string;
    metrics?: Array<{ label: string; value: string | number; valueColor?: string }>;
    accentColor?: string;
};

// Next OG is very strict about styles and requires explicitly providing them
// in a format it understands (React CSS properties, no external stylesheets).
// Let's create a generic shell for all aggregate OGs using the OG_THEME.
export function renderAggregateOgShell(props: BaseAggregateOgProps) {
    const accent = props.accentColor || OG_THEME.colors.primary;

    return (
        <div style={{
            background: OG_THEME.colors.background,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: OG_THEME.fonts.sans,
            padding: 64,
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                width: "100%",
                borderBottom: `4px solid ${accent}`,
                paddingBottom: 24,
                marginBottom: 48,
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, color: OG_THEME.colors.foreground }}>
                    MAPA CALÇADAS SF
                </span>
                <span style={{ fontSize: 24, fontWeight: 600, color: OG_THEME.colors.neutral.text }}>
                    Monitoramento Cidadão
                </span>
            </div>

            {/* Content Body */}
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                
                {/* Badges / Subtitle */}
                <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                    <div style={{
                        background: accent,
                        color: OG_THEME.colors.white,
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 24,
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                    }}>
                        Leiaute Agregado
                    </div>
                    <div style={{
                        background: OG_THEME.colors.neutral.bg,
                        color: OG_THEME.colors.neutral.text,
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: 24,
                        fontWeight: 'bold'
                    }}>
                        {props.subtitle}
                    </div>
                </div>

                {/* Main Title */}
                <h1 style={{
                    fontSize: 64,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    color: OG_THEME.colors.foreground,
                    marginBottom: 24,
                    letterSpacing: -2
                }}>
                    {truncateText(props.title, 80)}
                </h1>

                {/* Description */}
                <p style={{
                    fontSize: 32,
                    color: OG_THEME.colors.neutral.text,
                    lineHeight: 1.4,
                    maxWidth: "90%",
                    marginBottom: 48
                }}>
                    {truncateText(props.description, 140)}
                </p>

                {/* Metrics Grid (if any) */}
                {props.metrics && props.metrics.length > 0 && (
                    <div style={{ display: "flex", gap: 32, marginTop: "auto" }}>
                        {props.metrics.map((m, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: 24, color: OG_THEME.colors.neutral.text, marginBottom: 8 }}>
                                    {m.label}
                                </span>
                                <span style={{ fontSize: 56, fontWeight: '900', color: m.valueColor || OG_THEME.colors.foreground }}>
                                    {m.value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                display: "flex",
                borderTop: `1px solid ${OG_THEME.colors.neutral.border}`,
                paddingTop: 24,
                fontSize: 24,
                color: OG_THEME.colors.neutral.text,
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <span>Leitura Estratégica do Mapa</span>
                <span style={{ fontWeight: 'bold' }}>Plataforma Ativa</span>
            </div>
        </div>
    );
}
