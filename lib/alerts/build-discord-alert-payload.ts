import { AlertEventItem } from "./alert-types";
import { DiscordWebhookConfig } from "./native-destination-types";

export interface DiscordPayload {
    content?: string;
    username?: string;
    embeds?: Array<Record<string, unknown>>;
}

export function buildDiscordAlertPayload(
    event: AlertEventItem,
    config: DiscordWebhookConfig,
    publicUrl?: string,
    photoUrl?: string
): DiscordPayload {
    const isCritical = event.severity === "high" || event.severity === "critical";
    
    // Discord Embed Colors (Decimal)
    const color = isCritical ? 15158332 : event.severity === "medium" ? 15105570 : 3447003;
    const emoji = isCritical ? "🔴" : event.severity === "medium" ? "🟠" : "🔵";

    let content = "";
    if (publicUrl && config.includeOgLink !== false) {
        content = `🔗 **Detalhes:** ${publicUrl}`;
    }

    const embed: Record<string, unknown> = {
        title: `${emoji} ${event.title}`,
        description: event.summary,
        color: color,
        fields: [
            {
                name: "Escopo",
                value: event.scope,
                inline: true
            },
            {
                name: "Bairro",
                value: event.neighborhood || "N/A",
                inline: true
            },
            {
                name: "Severidade",
                value: event.severity.toUpperCase(),
                inline: true
            }
        ],
        footer: {
            text: "Mapa Calçadas SF Alertas"
        },
        timestamp: new Date().toISOString()
    };

    if (photoUrl) {
        embed.image = {
            url: photoUrl
        };
    }

    if (publicUrl) {
        embed.url = publicUrl;
    }

    return {
        username: config.username || "Alertas Mapa Calçadas",
        content: content || undefined,
        embeds: [embed]
    };
}
