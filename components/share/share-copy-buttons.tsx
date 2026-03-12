"use client";

import { useState } from "react";

interface CopyButtonProps {
    textToCopy: string;
    label: string;
    variant?: 'link' | 'text';
}

export function ShareCopyButton({ textToCopy, label, variant = 'text' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700 w-full justify-center"
        >
            {copied ? (
                <>
                    <span className="text-green-600">✓</span>
                    <span className="text-green-600">Copiado!</span>
                </>
            ) : (
                <>
                    <span>{variant === 'link' ? "🔗" : "📄"}</span>
                    <span>{label}</span>
                </>
            )}
        </button>
    );
}
