"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ReportPhotoModeratorProps = {
  reportId: string;
};

type SignedApiResponse = {
  ok: boolean;
  url?: string;
  message?: string;
};

/**
 * Variante do ReportPhoto para moderadores.
 * Sempre tenta carregar foto (via API que permite moderadores ver fotos nao publicadas).
 */
export function ReportPhotoModerator({ reportId }: ReportPhotoModeratorProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const response = await fetch(`/api/reports/photo/signed?reportId=${reportId}`);
        const payload: SignedApiResponse = await response.json();

        if (payload.ok && payload.url) {
          setSignedUrl(payload.url);
        }
      } catch {
        // Degrada silenciosamente
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();
  }, [reportId]);

  if (loading) {
    return <p className="text-xs text-zinc-500">Carregando foto...</p>;
  }

  if (!signedUrl) {
    return null; // Sem foto, degrada
  }

  return (
    <div className="mt-2">
      <p className="mb-1 text-xs font-semibold">Foto:</p>
      <Image
        src={signedUrl}
        alt="Foto do report"
        width={800}
        height={600}
        className="max-h-32 border border-zinc-300"
        style={{ width: 'auto', height: 'auto', maxHeight: '8rem' }}
      />
    </div>
  );
}
