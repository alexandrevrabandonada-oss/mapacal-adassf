import { AlertEventItem } from "./alert-types";
import { TelegramBotConfig } from "./native-destination-types";

export interface TelegramPayload {
    chat_id: string;
    text?: string;
    photo?: string;
    caption?: string;
    parse_mode: "HTML";
    disable_web_page_preview?: boolean;
}

export function buildTelegramAlertPayload(
    event: AlertEventItem,
    config: TelegramBotConfig,
    publicUrl?: string,
    photoUrl?: string
): TelegramPayload | null {
    if (!config.chatId) {
        return null;
    }

    const isCritical = event.severity === "high" || event.severity === "critical";
    const headerEmoji = isCritical ? "🔴" : event.severity === "medium" ? "🟠" : "🔵";

    const escapeHtml = (unsafe: string) => {
        return (unsafe || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    let bodyText = `<b>${headerEmoji} Alerta: ${escapeHtml(event.title)}</b>\n\n`;
    bodyText += `${escapeHtml(event.summary || "")}\n\n`;
    
    bodyText += `<b>Escopo:</b> ${escapeHtml(event.scope)}\n`;
    bodyText += `<b>Bairro:</b> ${escapeHtml(event.neighborhood || "N/A")}\n`;
    bodyText += `<b>Severidade:</b> ${escapeHtml(event.severity.toUpperCase())}\n`;

    if (publicUrl && config.includeOgLink !== false) {
        bodyText += `\n<a href="${publicUrl}">🔗 Ver Detalhes no Portal</a>`;
    }

    if (photoUrl) {
        return {
            chat_id: config.chatId,
            photo: photoUrl,
            caption: bodyText,
            parse_mode: "HTML"
        };
    }

    return {
        chat_id: config.chatId,
        text: bodyText,
        parse_mode: "HTML",
        disable_web_page_preview: config.disableWebPagePreview ?? false
    };
}
