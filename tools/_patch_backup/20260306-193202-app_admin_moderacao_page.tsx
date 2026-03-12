import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

export default function ModeracaoPage() {
  return (
    <SiteShell
      title="Moderacao"
      subtitle="Area administrativa visualmente destacada para triagem. Protecao real de acesso entra junto com auth no T02."
    >
      <SectionCard title="Painel placeholder" eyebrow="Acesso visual apenas">
        <ul className="space-y-2">
          <li>- Fila de relatos pendentes</li>
          <li>- Classificacao por gravidade e impacto</li>
          <li>- Regras de linguagem e evidencias minimas</li>
          <li>- Encaminhamento para status publicado</li>
        </ul>
      </SectionCard>

      <SectionCard title="Aviso" eyebrow="Seguranca">
        <p>
          Esta tela ainda nao aplica autenticacao nem autorizacao. Ela existe para validar navegacao,
          sem semantica de permissao ativa neste tijolo.
        </p>
      </SectionCard>
    </SiteShell>
  );
}
