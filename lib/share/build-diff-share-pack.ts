import { SharePackData } from "./share-pack-types";
import { buildAbsoluteUrl, buildWhatsappUrl, formatShortDate } from "./share-pack-utils";
import { SHARE_STRINGS } from "./share-copy";

export function buildDiffSharePack(
    diff: any // public_snapshot_diffs item
): SharePackData {
    const path = `/snapshots/diffs/${diff.id}`;
    const publicUrl = buildAbsoluteUrl(path);
    const imageUrl = buildAbsoluteUrl(`${path}/opengraph-image`);
    
    const dateStr = formatShortDate(diff.created_at);
    const title = `${SHARE_STRINGS.labels.diff}: ${diff.title || `Comparação de ${dateStr}`}`;
    
    let directions = "";
    if (diff.diff_data?.summary) {
        const s = diff.diff_data.summary;
        directions = `Sentido: ${s.direction || "N/A"}`;
    }

    const summary = `Diferencial materializado entre dois períodos. ${directions}`;
    
    let plainText = `${title}\n\n`;
    plainText += `📅 Gerado em: ${dateStr}\n`;
    if (directions) plainText += `📈 ${directions}\n\n`;
    plainText += `🔗 ${SHARE_STRINGS.cta.viewDiff}`;

    return {
        kind: 'snapshot_diff',
        title,
        summary,
        plainText,
        publicUrl,
        imageUrl,
        whatsappUrl: buildWhatsappUrl(plainText, publicUrl)
    };
}
