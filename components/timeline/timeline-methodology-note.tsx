import { SectionCard } from "@/components/section-card";

export function TimelineMethodologyNote() {
  return (
    <SectionCard title="Metodologia" eyebrow="Leitura publica e honesta">
      <ul className="space-y-1 text-sm text-zinc-700">
        <li>- Base: apenas relatos com status published.</li>
        <li>- Bucket: agregacao por dia ou semana.</li>
        <li>- Hotspot score: indice simples de priorizacao temporal (volume, verificacao, bloqueio e recencia).</li>
        <li>- O score nao representa verdade absoluta e nao implica causalidade.</li>
        <li>- Use junto com /territorio, /mapa e /comparativos para decisao publica mais robusta.</li>
      </ul>
    </SectionCard>
  );
}
