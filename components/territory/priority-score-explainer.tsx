import { SectionCard } from "@/components/section-card";

export function PriorityScoreExplainer() {
  return (
    <SectionCard title="Como o indice funciona" eyebrow="Transparencia metodologica">
      <p className="text-sm text-zinc-800">
        O indice de prioridade e um sinal publico inicial para organizar acao coletiva. A formula atual e:
      </p>
      <p className="mt-3 border-2 border-[var(--ink)] bg-white px-3 py-2 text-sm font-black">
        prioridade = (blocked x 3.0) + (bad x 2.0) + (verified x 1.5) + (published x 1.0)
      </p>
      <ul className="mt-3 space-y-1 text-sm text-zinc-700">
        <li>- Nao e verdade absoluta: e uma heuristica de partida.</li>
        <li>- Nao mede toda malha viaria, apenas relatos publicados.</li>
        <li>- Nao usa fronteiras oficiais de bairro neste tijolo.</li>
      </ul>
    </SectionCard>
  );
}
