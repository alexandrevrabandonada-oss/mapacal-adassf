export type SharePackKind = 
    | 'alert' 
    | 'snapshot_transparency' 
    | 'snapshot_territory' 
    | 'snapshot_diff';

export interface SharePackData {
    kind: SharePackKind;
    title: string;
    summary: string;
    plainText: string;
    publicUrl: string;
    imageUrl?: string;
    whatsappUrl: string;
}

export interface SharePackResult {
    ok: boolean;
    message?: string;
    data?: SharePackData;
}
