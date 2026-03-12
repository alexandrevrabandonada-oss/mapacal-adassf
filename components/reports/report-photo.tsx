"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ReportPhotoProps = {
  reportId: string;
};

type SignedApiResponse = {
  ok: boolean;
  url?: string;
  message?: string;
};

export function ReportPhoto({ reportId }: ReportPhotoProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const response = await fetch(`/api/reports/photo/signed?reportId=${reportId}`);
        const payload: SignedApiResponse = await response.json();

        if (payload.ok && payload.url) {
          setSignedUrl(payload.url);
        } else {
          setError(payload.message || "Foto nao disponivel");
        }
      } catch {
        setError("Erro ao carregar foto");
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();
  }, [reportId]);

  if (loading) {
    return <p className="text-xs text-zinc-600">Carregando foto...</p>;
  }

  if (error || !signedUrl) {
    return null; // Degrada silenciosamente se nao houver foto
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em]">Foto</p>
      <Image
        src={signedUrl}
        alt="Foto do local"
        width={800}
        height={600}
        className="max-h-96 border-2 border-[var(--ink)]"
        style={{ width: 'auto', height: 'auto', maxHeight: '24rem' }}
      />
    </div>
  );
}
