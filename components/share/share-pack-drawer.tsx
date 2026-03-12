"use client";

import { useState, useEffect, useCallback } from "react";
import { SharePackData } from "@/lib/share/share-pack-types";
import { SharePackPreview } from "./share-pack-preview";
import { ShareActions } from "./share-actions";

interface SharePackDrawerProps {
    id: string;
    kind: 'alertas' | 'snapshots/transparencia' | 'snapshots/territorio' | 'snapshots/diffs';
    triggerLabel?: string;
    className?: string;
}

export function SharePackDrawer({ id, kind, triggerLabel = "Compartilhar", className = "" }: SharePackDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pack, setPack] = useState<SharePackData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadPack = useCallback(async () => {
        if (pack) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/share/${kind}/${id}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Erro ao carregar dados de compartilhamento");
            }
            const data = await res.json();
            setPack(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id, kind, pack]);

    useEffect(() => {
        if (isOpen) {
            loadPack();
        }
    }, [isOpen, loadPack]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium ${className}`}
            >
                <span>📤</span>
                <span>{triggerLabel}</span>
            </button>

            {/* Simple Backdrop/Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div 
                        className="w-full max-w-lg bg-white rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between p-4 border-bottom border-zinc-100 bg-zinc-50">
                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <span>📤</span>
                                Compartilhar
                            </h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-full hover:bg-zinc-200 transition-colors text-zinc-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4 text-zinc-500">
                                    <span className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></span>
                                    <p className="text-sm font-medium">Preparando pacote de share...</p>
                                </div>
                            ) : error ? (
                                <div className="py-8 text-center space-y-2">
                                    <p className="text-red-600 font-medium font-bold">Ocorreu um erro</p>
                                    <p className="text-zinc-600 text-sm">{error}</p>
                                    <button 
                                        onClick={loadPack}
                                        className="mt-4 text-sm text-blue-600 hover:underline"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : pack ? (
                                <>
                                    <SharePackPreview pack={pack} />
                                    <ShareActions pack={pack} />
                                </>
                            ) : null}
                        </div>

                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            Mapa Calçadas SF — Sistema de Circulação
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
