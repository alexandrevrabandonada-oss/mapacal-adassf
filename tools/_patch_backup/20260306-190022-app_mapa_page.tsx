import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";

export default function MapaPage() {
  return (
    <SiteShell
      title="Mapa base da cidade"
      subtitle="Leitura inicial do territorio: neste tijolo, o modulo de mapa e um placeholder honesto para preparar as camadas reais do T04."
    >
      <SectionCard title="Mapa interativo entra no T04" eyebrow="Estado atual">
        <div className="flex min-h-56 items-center justify-center border-2 border-dashed border-[var(--concrete)] bg-[var(--paper)] p-6 text-center text-sm font-semibold uppercase tracking-[0.08em] text-[var(--concrete)]">
          Placeholder tecnico: sem geometria ainda
        </div>
      </SectionCard>

      <SectionCard title="Filtros visuais" eyebrow="Previa de UX">
        <div className="flex flex-wrap gap-2">
          <span className="border-2 border-[var(--ink)] bg-white px-3 py-1 text-xs font-bold uppercase">Risco alto</span>
          <span className="border-2 border-[var(--ink)] bg-white px-3 py-1 text-xs font-bold uppercase">Acessibilidade</span>
          <span className="border-2 border-[var(--ink)] bg-white px-3 py-1 text-xs font-bold uppercase">Obra em aberto</span>
        </div>
        <p className="mt-3">Os filtros ainda nao consultam dados. Eles antecipam a navegacao que sera ligada ao backend no T02-T04.</p>
      </SectionCard>

      <SectionCard title="Proximas camadas" eyebrow="Roadmap tecnico">
        <ul className="space-y-2">
          <li>- T02: base de dados e autenticacao.</li>
          <li>- T03: ingestao inicial e regras de moderacao.</li>
          <li>- T04: mapa interativo com pontos reais.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Leitura de campo" eyebrow="Concreto Zen">
        <p>
          O foco e construir uma ferramenta util para quem caminha. Nada de mapa vazio com promessa vaga: cada
          camada entra com verificacao e rastreabilidade.
        </p>
      </SectionCard>
    </SiteShell>
  );
}
