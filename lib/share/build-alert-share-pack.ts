import { AlertEventItem } from "../alerts/alert-types";
import { SharePackData } from "./share-pack-types";
import { buildAbsoluteUrl, buildWhatsappUrl, truncateForShare } from "./share-pack-utils";
import { SHARE_STRINGS } from "./share-copy";

export function buildAlertSharePack(
    alert: AlertEventItem,
    id: string
): SharePackData {
    const publicUrl = buildAbsoluteUrl(`/alertas/${id}`);
    const imageUrl = buildAbsoluteUrl(`/alertas/${id}/opengraph-image`);
    
    const severityLabel = alert.severity.toUpperCase();
    const neighborhood = alert.neighborhood || "Cidade";
    
    const title = `${SHARE_STRINGS.labels.alert}: ${alert.title}`;
    const summary = truncateForShare(alert.summary || "", 150);
    
    let plainText = `${title}\n\n`;
    plainText += `📍 Bairro: ${neighborhood}\n`;
    plainText += `⚠️ Severidade: ${severityLabel}\n\n`;
    plainText += `${summary}\n\n`;
    plainText += `🔗 ${SHARE_STRINGS.cta.viewAlert}`;

    return {
        kind: 'alert',
        title,
        summary,
        plainText,
        publicUrl,
        imageUrl,
        whatsappUrl: buildWhatsappUrl(plainText, publicUrl)
    };
}
