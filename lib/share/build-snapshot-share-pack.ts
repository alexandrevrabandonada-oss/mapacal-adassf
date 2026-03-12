import { SharePackData, SharePackKind } from "./share-pack-types";
import { buildAbsoluteUrl, buildWhatsappUrl, truncateForShare, formatShortDate } from "./share-pack-utils";
import { SHARE_STRINGS } from "./share-copy";

export function buildSnapshotSharePack(
    snapshot: any, // public_snapshots item
    kind: 'snapshot_transparency' | 'snapshot_territory'
): SharePackData {
    const path = kind === 'snapshot_transparency' 
        ? `/snapshots/transparencia/${snapshot.id}` 
        : `/snapshots/territorio/${snapshot.id}`;
    
    const publicUrl = buildAbsoluteUrl(path);
    const imageUrl = buildAbsoluteUrl(`${path}/opengraph-image`);
    
    const label = kind === 'snapshot_transparency' 
        ? SHARE_STRINGS.labels.transparency 
        : SHARE_STRINGS.labels.territory;
    
    const dateStr = formatShortDate(snapshot.created_at);
    const timeWindow = snapshot.days || (snapshot.data as any)?.time_window_days || "30";
    
    const title = `${label}: ${snapshot.title || `Fotografia de ${dateStr}`}`;
    
    let stats = "";
    if (snapshot.data?.summary) {
        const s = snapshot.data.summary;
        if (kind === 'snapshot_transparency') {
            stats = `Publicados: ${s.total_published || 0} | Bloqueados: ${s.total_blocked || 0}`;
        } else {
            stats = `Bairros com problemas: ${s.neighborhoods_with_issues || 0}`;
        }
    }

    const summary = `Snapshot gerado na janela de ${timeWindow} dias. ${stats}`;
    
    let plainText = `${title}\n\n`;
    plainText += `📅 Data: ${dateStr}\n`;
    plainText += `⏱️ Janela: ${timeWindow} dias\n`;
    if (stats) plainText += `📊 ${stats}\n\n`;
    plainText += `🔗 ${SHARE_STRINGS.cta.viewSnapshot}`;

    return {
        kind,
        title,
        summary: truncateForShare(summary, 150),
        plainText,
        publicUrl,
        imageUrl,
        whatsappUrl: buildWhatsappUrl(plainText, publicUrl)
    };
}
