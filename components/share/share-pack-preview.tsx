"use client";

import { SharePackData } from "@/lib/share/share-pack-types";
import Image from "next/image";

interface SharePackPreviewProps {
    pack: SharePackData;
}

export function SharePackPreview({ pack }: SharePackPreviewProps) {
    return (
        <div className="bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden text-sm">
            {pack.imageUrl && (
                <div className="aspect-[1200/630] w-full bg-zinc-200 relative overflow-hidden flex items-center justify-center">
                    <Image 
                        src={pack.imageUrl} 
                        alt={pack.title} 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 text-zinc-400 font-bold text-xl uppercase tracking-widest">
                        Preview Indisponível
                    </div>
                </div>
            )}
            <div className="p-4 space-y-2">
                <div className="font-bold text-zinc-900">{pack.title}</div>
                <div className="text-zinc-600 line-clamp-3 whitespace-pre-wrap">{pack.summary}</div>
                <div className="text-blue-600 text-xs truncate">{pack.publicUrl}</div>
            </div>
            <div className="px-4 py-3 bg-white border-t border-zinc-200">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Mensagem do WhatsApp</div>
                <div className="p-2 bg-green-50 rounded border border-green-100 text-xs text-zinc-700 whitespace-pre-wrap font-mono">
                    {pack.plainText}
                </div>
            </div>
        </div>
    );
}
