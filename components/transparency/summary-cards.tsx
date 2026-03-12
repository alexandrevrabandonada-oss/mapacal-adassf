"use client";

import { SectionCard } from "@/components/section-card";

export type SummaryCardsProps = {
  total_published: number;
  total_verified: number;
  total_pending: number;
  total_needs_review: number;
  total_hidden: number;
};

export function SummaryCards(props: SummaryCardsProps) {
  return (
    <SectionCard title="Resumo geral" eyebrow="Dados agregados">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">
            Publicados
          </p>
          <p className="mt-2 text-4xl font-black">{props.total_published}</p>
          <p className="mt-1 text-xs text-zinc-600">no mapa publico</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">
            Verificados
          </p>
          <p className="mt-2 text-4xl font-black">{props.total_verified}</p>
          <p className="mt-1 text-xs text-zinc-600">com confirmacoes</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">
            Pendentes
          </p>
          <p className="mt-2 text-4xl font-black">{props.total_pending}</p>
          <p className="mt-1 text-xs text-zinc-600">em fila</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">
            Revisao
          </p>
          <p className="mt-2 text-4xl font-black">{props.total_needs_review}</p>
          <p className="mt-1 text-xs text-zinc-600">solicitada</p>
        </div>

        <div className="border-2 border-[var(--ink)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">
            Ocultos
          </p>
          <p className="mt-2 text-4xl font-black">{props.total_hidden}</p>
          <p className="mt-1 text-xs text-zinc-600">removidos</p>
        </div>
      </div>
    </SectionCard>
  );
}
