"use client";

import { SectionCard } from "@/components/section-card";

export function ComparisonMethodologyNote() {
  return (
    <SectionCard
      title="Metodologia"
      eyebrow="Como lemos o comparativo"
    >
      <div className="space-y-3 text-xs text-zinc-700">
        <div>
          <p className="font-semibold mb-1">🔢 Comparação por taxa, não por contagem</p>
          <p className="text-zinc-600">
            Comparamos <strong>registros por dia</strong> entre períodos de tamanhos
            diferentes. Exemplo: 5 registros em 7 dias = 0.71/dia; 20 em 30 dias = 0.67/dia.
            Isso evita ilusões causadas por períodos maiores.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">📊 Percentual confiável apenas com baseline</p>
          <p className="text-zinc-600">
            Quando a linha-base tem zero registros, o % fica &quot;—&quot;. Isso é honesto: não
            podemos quantificar crescimento infinito a partir de zero.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">📈 Verde = melhora; Vermelho = piora</p>
          <p className="text-zinc-600">
            Delta positivo significa mais registros/dia agora. Delta negativo significa
            menos. Cores acompanham para leitura rápida.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">⚠️ Não é série histórica</p>
          <p className="text-zinc-600">
            As janelas são <strong>móveis</strong> (sempre contando para trás a partir de
            agora). Isso significa que ontem a janela era diferente. Para análise profunda
            de tendências, snapshot materializado seria necessário.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-1">🎯 Use junto com /territorio e /mapa</p>
          <p className="text-zinc-600">
            Comparativos mostram quais bairros/condições acelerarem. Para entender
            <em>por quê</em>, use os mapas e rankings territoriais.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
