import { AlertEventItem } from "./alert-types";
import { SlackWebhookConfig } from "./native-destination-types";

// Tipagem segura para envio via fetch
export interface SlackPayload {
    text?: string;
    blocks?: Array<Record<string, unknown>>;
}

export function buildSlackAlertPayload(
    event: AlertEventItem,
    config: SlackWebhookConfig,
    publicUrl?: string,
    photoUrl?: string
): SlackPayload {
    const isCritical = event.severity === "high" || event.severity === "critical";
    const headerColor = isCritical ? "🔴" : event.severity === "medium" ? "🟠" : "🔵";
    const titleText = `${headerColor} *Alerta: ${event.title}*`;

    let textFallback = `${titleText}\n${event.summary}`;
    if (publicUrl && config.includeOgLink !== false) {
        textFallback += `\n🔗 Ver detalhes: ${publicUrl}`;
    }

    const blocks: Array<Record<string, unknown>> = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `${headerColor} ${config.channelLabel ? `[${config.channelLabel}] ` : ""}Alerta Mapa Calçadas SF`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${event.title}*\n${event.summary}`
            }
        }
    ];

    if (photoUrl) {
        blocks.push({
            type: "image",
            image_url: photoUrl,
            alt_text: event.title
        });
    }

    blocks.push({
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: `*Escopo:* ${event.scope} | *Bairro:* ${event.neighborhood || "N/A"} | *Severidade:* ${event.severity}`
            }
        ]
    });

    if (publicUrl && config.includeOgLink !== false) {
        blocks.push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Ver Detalhes"
                    },
                    url: publicUrl,
                    style: isCritical ? "danger" : "primary"
                }
            ]
        });
    }

    return {
        text: textFallback,
        blocks
    };
}
