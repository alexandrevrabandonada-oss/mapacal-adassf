import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import { ConfirmReportButton } from "@/components/reports/confirm-report-button";
import { ReportPhoto } from "@/components/reports/report-photo";
import { getConditionLabel } from "@/lib/domain/sidewalk";
import { getPublishedReportById } from "@/lib/reports/list-published";

type RelatoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RelatoDetalhePage({ params }: RelatoDetalhePageProps) {
  const { id } = await params;
  const result = await getPublishedReportById(id);

  if (result.reason === "not-found") {
    notFound();
  }

  return (
    <SiteShell
      title={`Relato ${id}`}
      subtitle="Detalhe publico de registro publicado no mapa coletivo."
    >
      {result.reason === "env-missing" || result.reason === "rpc-missing" || !result.item ? (
        <SectionCard title="Detalhe indisponivel" eyebrow="Estado seguro">
          <p>{result.message || "Nao foi possivel carregar o registro agora."}</p>
          <Link
            href="/mapa"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Voltar ao mapa
          </Link>
        </SectionCard>
      ) : (
        <>
          <SectionCard title="Resumo do ponto" eyebrow="Publicado">
            <ul className="space-y-2">
              <li>- Condicao: {getConditionLabel(result.item.condition)}</li>
              <li>- Bairro: {result.item.neighborhood || "Nao informado"}</li>
              <li>- Data: {new Date(result.item.created_at).toLocaleString("pt-BR")}</li>
              <li>- Confirmacoes: {result.item.verification_count}</li>
              <li>- Verificado: {result.item.is_verified ? "sim" : "nao"}</li>
            </ul>
            <ConfirmReportButton
              reportId={result.item.id}
              initialVerificationCount={result.item.verification_count}
              initialIsVerified={result.item.is_verified}
            />
          </SectionCard>

          <SectionCard title="Observacao" eyebrow="Contexto">
            <p>{result.item.note || "Sem observacao registrada para este ponto."}</p>
            <ReportPhoto reportId={result.item.id} />
            <Link
              href="/mapa"
              className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
            >
              Voltar ao mapa
            </Link>
          </SectionCard>
        </>
      )}
    </SiteShell>
  );
}
