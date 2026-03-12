import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

const metrics = [
  { label: "Relatos recebidos", value: "000" },
  { label: "Relatos moderados", value: "000" },
  { label: "Acoes concluidas", value: "000" },
  { label: "Tempo medio de resposta", value: "--" }
];

export default function TransparenciaPage() {
  return (
    <SiteShell
      title="Transparencia"
      subtitle="Painel publico para acompanhar volume, moderacao e respostas. Os numeros abaixo sao placeholders do desenho informacional."
    >
      <SectionCard title="Indicadores principais" eyebrow="Painel inicial">
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <article key={metric.label} className="border-2 border-[var(--ink)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--concrete)]">{metric.label}</p>
              <p className="mt-1 text-3xl font-black">{metric.value}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Compromisso de publicacao" eyebrow="Governanca">
        <p>
          Cada etapa futura precisa manter trilha de auditoria e linguagem clara para quem nao e tecnico.
          O painel final vai separar relato bruto, moderacao, priorizacao e execucao.
        </p>
      </SectionCard>
    </SiteShell>
  );
}
