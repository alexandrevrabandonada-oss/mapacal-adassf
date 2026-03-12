"use client";

import { SharePackData } from "@/lib/share/share-pack-types";
import { ShareCopyButton } from "./share-copy-buttons";

interface ShareActionsProps {
    pack: SharePackData;
}

export function ShareActions({ pack }: ShareActionsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
                href={pack.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium justify-center"
            >
                <span>💬</span>
                <span>Enviar para WhatsApp</span>
            </a>

            <ShareCopyButton 
                textToCopy={pack.publicUrl} 
                label="Copiar Link" 
                variant="link" 
            />

            <ShareCopyButton 
                textToCopy={pack.plainText} 
                label="Copiar Texto Pronto" 
                variant="text" 
            />

            <a
                href={pack.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200 transition-colors text-sm font-medium justify-center border border-zinc-200"
            >
                <span>🌐</span>
                <span>Abrir Link Público</span>
            </a>
        </div>
    );
}
