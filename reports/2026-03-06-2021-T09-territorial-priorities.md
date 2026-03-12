# T09 Territorial Priorities - Relatorio de Verificacao
**Data:** 2026-03-06 20:22:20

## Objetivo

Entregar primeira camada de cobertura territorial por bairro com indice publico inicial de prioridade, recortes por condicao/verificacao e ponte clara entre /territorio, /mapa e /transparencia.

## DIAG

### Arquivos criados/alterados

#### Criados (T09)
OK: `supabase/sql/T09_territorial_priorities.sql`
OK: `lib/reports/get-neighborhood-priority-breakdown.ts`
OK: `lib/reports/get-neighborhood-recent-alerts.ts`
OK: `lib/reports/get-priority-map-points.ts`
OK: `components/territory/priority-summary-cards.tsx`
OK: `components/territory/neighborhood-priority-table.tsx`
OK: `components/territory/recent-alerts-list.tsx`
OK: `components/territory/priority-score-explainer.tsx`
OK: `app/territorio/page.tsx`
OK: `docs/T09_TERRITORIAL_PRIORITIES.md`
OK: `tools/T09_verify.ps1`

#### Alterados (integracao)
- `app/mapa/page.tsx`
- `app/transparencia/page.tsx`
- `app/page.tsx`
- `components/map/report-filters.tsx`
- `components/map/report-map-client.tsx`
- `components/top-nav.tsx`
- `types/database.ts`

### Estrategia escolhida para prioridade territorial

- Base em relatos published.
- Janela temporal por parametro (in_days, default 90).
- Score simples e explicito para incidencia publica:
  - locked * 3.0 + bad * 2.0 + verified * 1.5 + published * 1.0
- Sem vender score como verdade absoluta.
- Sem shapefile/geometria externa neste tijolo.

### Estrategia escolhida para integrar com /mapa e /transparencia

- /transparencia ganhou atalho direto para /territorio.
- /mapa ganhou ponte para leitura territorial.
- /mapa ganhou filtros rapidos de prioridade (penas verificados, penas bloqueios).
- Marcadores receberam destaque visual simples para bloqueios/verificados sem introduzir camada instavel.

## VERIFY

### npm install
Exit code: 0
Status: PASS

### lint
Exit code: 0
Status: PASS


txt lint (ultimas linhas):
`

> mapa-calcadas-sf@0.1.0 lint
> eslint . --max-warnings=0



`

### typecheck
Exit code: 2
Status: FAIL


txt typecheck (ultimas linhas):
`

> mapa-calcadas-sf@0.1.0 typecheck
> tsc --noEmit

tools/_patch_backup/20260306_201721-components_map_report-map-client.tsx(8,34): error TS2307: Cannot find module './report-detail-card' or its corresponding type declarations.
tools/_patch_backup/20260306_201721-components_map_report-map-client.tsx(9,31): error TS2307: Cannot find module './report-filters' or its corresponding type declarations.
tools/_patch_backup/20260306_201721-components_map_report-map-client.tsx(10,28): error TS2307: Cannot find module './report-list' or its corresponding type declarations.


`

### build
Exit code: 1
Status: FAIL


txt build (ultimas linhas):
`

> mapa-calcadas-sf@0.1.0 build
> next build

   Ôû▓ Next.js 15.5.12

   Creating an optimized production build ...
 Ô£ô Compiled successfully in 7.4s
   Linting and checking validity of types ...
Failed to compile.

./tools/_patch_backup/20260306_201721-components_map_report-map-client.tsx:8:34
Type error: Cannot find module './report-detail-card' or its corresponding type declarations.

   6 | import type { PublicMapReportItem } from "@/lib/reports/list-published-types";
   7 |
>  8 | import { ReportDetailCard } from "./report-detail-card";
     |                                  ^
   9 | import { ReportFilters } from "./report-filters";
  10 | import { ReportList } from "./report-list";
  11 |
Next.js build worker exited with code: 1 and signal: null


`

### Checklist de arquivos esperados

OK: `supabase/sql/T09_territorial_priorities.sql`
OK: `lib/reports/get-neighborhood-priority-breakdown.ts`
OK: `lib/reports/get-neighborhood-recent-alerts.ts`
OK: `lib/reports/get-priority-map-points.ts`
OK: `components/territory/priority-summary-cards.tsx`
OK: `components/territory/neighborhood-priority-table.tsx`
OK: `components/territory/recent-alerts-list.tsx`
OK: `components/territory/priority-score-explainer.tsx`
OK: `app/territorio/page.tsx`
OK: `docs/T09_TERRITORIAL_PRIORITIES.md`
OK: `tools/T09_verify.ps1`

## Leitura fria do estado atual

### O que a leitura territorial ja faz de verdade

- Mostra ranking por bairro com prioridade calculada.
- Mostra recortes locked, ad, good, verificados e com foto.
- Exibe alertas recentes graves/novos com link para detalhe do relato.
- Conecta de forma direta ao mapa e ao painel de transparencia.

### O que depende de env/sql/dados

- Sem env (NEXT_PUBLIC_SUPABASE_*), a UI degrada para estado informativo.
- Sem SQL T09 aplicado, a pagina informa RPC pendente sem quebrar build.
- Sem dados publicados, pagina mostra estado vazio sem erro.

### Riscos remanescentes

- 
eighborhood textual pode trazer inconsistencias ortograficas.
- Score ainda nao considera populacao, fluxo de pedestres ou malha oficial.
- Sem heatmap denso; apenas destaque simplificado para estabilidade.

## NEXT

- T10: filtros temporais ricos + snapshots publicos.
- ou T09b: heatmap real e camada de densidade.

## Resultado final

T09 COM PENDENCIAS
