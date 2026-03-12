"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConfirmReportButtonProps = {
  reportId: string;
  initialVerificationCount: number;
  initialIsVerified: boolean;
};

export function ConfirmReportButton({
  reportId,
  initialVerificationCount,
  initialIsVerified,
}: ConfirmReportButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(initialVerificationCount);
  const [verified, setVerified] = useState(initialIsVerified);

  const handleConfirm = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/reports/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        message: string;
        verification_count?: number;
        is_verified?: boolean;
      };

      setMessage(data.message);

      if (data.ok) {
        if (typeof data.verification_count === "number") {
          setCount(data.verification_count);
        }
        if (typeof data.is_verified === "boolean") {
          setVerified(data.is_verified);
        }
        // refresh server component data apos 1s
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      console.error("[ConfirmReportButton] error:", err);
      setMessage("Erro ao confirmar ponto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t-2 border-[var(--ink)] pt-3">
      <p className="text-sm font-semibold">Confirmacoes atualizadas: {count}</p>
      {verified && (
        <span className="inline-block border border-[var(--ink)] bg-[var(--signal)] px-2 py-0.5 text-[11px] font-bold uppercase">
          Verificado pela comunidade
        </span>
      )}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="block border-2 border-[var(--ink)] bg-[var(--paper)] px-4 py-2 text-sm font-bold uppercase hover:bg-[var(--signal)] disabled:opacity-50"
      >
        {loading ? "Confirmando..." : "Confirmar este ponto"}
      </button>
      {message && (
        <p className={`text-sm ${message.includes("sucesso") ? "text-green-700" : "text-red-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
