import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

const steps = [
  "Identificar ponto e contexto do problema.",
  "Registrar evidencias com localizacao e descricao objetiva.",
  "Enviar para triagem, moderacao e classificacao de prioridade.",
  "Publicar no mapa com historico de atualizacoes."
];

export default function NovoPage() {
  return (
    <SiteShell
      title="Novo relato"
      subtitle="A coleta completa entra depois. Aqui desenhamos o fluxo para nao perder contexto nem rastreabilidade quando o formulario chegar."
    >
      <SectionCard title="Fluxo futuro" eyebrow="Passo a passo">
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="border-l-4 border-[var(--ink)] bg-white p-3 text-sm">
              <span className="mr-2 inline-block border-2 border-[var(--ink)] bg-[var(--signal)] px-2 py-1 text-xs font-black">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Campos previstos" eyebrow="Sem backend ainda">
        <ul className="space-y-2">
          <li>- Tipo de problema (piso, rampa, obstaculo, iluminacao).</li>
          <li>- Endereco e referencia visual.</li>
          <li>- Gravidade percebida e impacto em mobilidade.</li>
          <li>- Anexos e observacoes de campo.</li>
        </ul>
      </SectionCard>
    </SiteShell>
  );
}
