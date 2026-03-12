# T09 Territorial Priorities - Relatorio de Verificacao
**Data:** 2026-03-06 20:23:58

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
Exit code: 0
Status: PASS


txt typecheck (ultimas linhas):
`

> mapa-calcadas-sf@0.1.0 typecheck
> tsc --noEmit



`

### build
Exit code: 0
Status: PASS


txt build (ultimas linhas):
`
Ôö£ ãÆ /api/exports/reports.csv               148 B         102 kB
Ôö£ ãÆ /api/exports/reports.geojson           148 B         102 kB
Ôö£ ãÆ /api/reports/confirm                   148 B         102 kB
Ôö£ ãÆ /api/reports/create                    148 B         102 kB
Ôö£ ãÆ /api/reports/moderate                  148 B         102 kB
Ôö£ ãÆ /api/reports/moderation-list           148 B         102 kB
Ôö£ ãÆ /api/reports/nearby                    148 B         102 kB
Ôö£ ãÆ /api/reports/photo/signed              148 B         102 kB
Ôö£ ãÆ /api/reports/photo/upload              148 B         102 kB
Ôö£ ãÆ /auth/callback                         148 B         102 kB
Ôö£ ãÆ /auth/error                            166 B         106 kB
Ôö£ Ôùï /login                               2.17 kB         162 kB
Ôö£ Ôùï /manifest.webmanifest                  148 B         102 kB
Ôö£ Ôùï /mapa                                 1.4 kB         107 kB
Ôö£ Ôùï /novo                                4.86 kB         170 kB
Ôö£ ãÆ /r/[id]                              1.23 kB         112 kB
Ôö£ Ôùï /territorio                            166 B         106 kB
Ôöö Ôùï /transparencia                        1.6 kB         107 kB
+ First Load JS shared by all             102 kB
  Ôö£ chunks/255-ebd51be49873d76c.js         46 kB
  Ôö£ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  Ôöö other shared chunks (total)          2.05 kB


ãÆ Middleware                             85.1 kB

Ôùï  (Static)   prerendered as static content
ãÆ  (Dynamic)  server-rendered on demand



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

T09 VERDE
