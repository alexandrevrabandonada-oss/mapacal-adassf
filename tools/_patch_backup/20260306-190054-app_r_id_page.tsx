import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

type RelatoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RelatoDetalhePage({ params }: RelatoDetalhePageProps) {
  const { id } = await params;

  return (
    <SiteShell
      title={`Relato ${id}`}
      subtitle="Detalhe individual do ponto. Nesta fase, exibimos estrutura de leitura sem dados reais conectados."
    >
      <SectionCard title="Resumo do ponto" eyebrow="Placeholder">
        <ul className="space-y-2">
          <li>- ID: {id}</li>
          <li>- Status: em triagem inicial</li>
          <li>- Severidade estimada: media</li>
          <li>- Ultima atualizacao: aguardando backend</li>
        </ul>
      </SectionCard>

      <SectionCard title="Historico" eyebrow="Linha do tempo">
        <p>
          O historico real de mudancas sera preenchido quando a integracao de dados for habilitada. O objetivo
          aqui e garantir a rota e o layout de consulta.
        </p>
      </SectionCard>
    </SiteShell>
  );
}
