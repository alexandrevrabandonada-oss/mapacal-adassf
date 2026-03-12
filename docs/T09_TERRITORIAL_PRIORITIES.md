# T09 Territorial Priorities

## O que /territorio ja faz de verdade

A rota publica `/territorio` entrega leitura territorial inicial por bairro com base em relatos **published**:

- Ranking por bairro com `priority_score`
- Recortes por condicao (`blocked`, `bad`, `good`)
- Recorte por verificacao comunitaria (`>= 2` confirmacoes)
- Lista curta de alertas recentes priorizando `blocked` e `bad`
- Ponte de acao para `/mapa`, `/novo` e `/transparencia`

Essa camada nao substitui planejamento urbano completo. Ela organiza o primeiro ciclo de incidencia publica com dados disponiveis.

## Como aplicar o SQL T09 no Supabase

1. Abrir Supabase SQL Editor.
2. Garantir que T02 ate T08 foram aplicados.
3. Executar o arquivo `supabase/sql/T09_territorial_priorities.sql`.
4. Confirmar que as RPCs existem:
- `get_neighborhood_priority_breakdown`
- `get_neighborhood_recent_alerts`
- `get_priority_map_points`

## Formula do priority_score

Formula adotada no T09:

`priority = blocked * 3.0 + bad * 2.0 + verified * 1.5 + published * 1.0`

Onde:
- `blocked`: total de relatos `condition='blocked'`
- `bad`: total de relatos `condition='bad'`
- `verified`: relatos com pelo menos 2 confirmacoes
- `published`: total de relatos publicados no periodo

Os pesos sao intencionais e simples para leitura publica inicial.

## O que o indice quer dizer

- Sinaliza bairros com maior concentracao combinada de gravidade, volume e validacao comunitaria.
- Ajuda a definir ordem de visitas, mutiroes e cobranca publica.
- Facilita comunicacao entre mapa de pontos e pauta territorial.

## O que o indice NAO quer dizer

- Nao mede toda a qualidade da malha viaria da cidade.
- Nao e score tecnico definitivo de engenharia.
- Nao incorpora fronteiras oficiais, populacao, fluxo de pedestres ou renda.
- Nao substitui vistoria de campo.

## Fluxo manual de teste

1. Aplicar SQLs T02 ate T09 no Supabase.
2. Criar relatos em bairros diferentes via `/novo`.
3. Publicar parte dos relatos no fluxo de moderacao.
4. Confirmar alguns relatos por mais de um usuario.
5. Abrir `/territorio` e validar:
- cards de resumo
- ranking ordenado por prioridade
- alertas recentes
6. Abrir `/mapa` e usar filtros rapidos (`apenas verificados`, `apenas bloqueios`).
7. Abrir `/transparencia` e usar atalho para leitura territorial.

## Limitacoes atuais

- Depende do campo textual `neighborhood` informado no relato.
- Nao usa poligono oficial de bairro.
- Nao mede cobertura total da malha viaria.
- Nao gera heatmap denso por kernel; apenas leitura simplificada.

## Proximos passos possiveis

- Bairros oficiais com geometria de referencia
- Cobertura por trecho de via
- Heatmap real de densidade territorial
- Metas publicas por bairro
- Snapshots territoriais periodicos
