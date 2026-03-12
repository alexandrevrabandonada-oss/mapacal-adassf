# T12 Timeline Hotspots Report

## Objetivo
Entregar a primeira camada publica de timeline visual e hotspots temporais com ponte para mapa, territorio e comparativos, preservando degradacao segura e estabilidade de build.

## DIAG
### Arquivos criados/alterados
 M app/admin/moderacao/page.tsx
 M app/mapa/page.tsx
 M app/novo/page.tsx
 M app/page.tsx
 M app/r/[id]/page.tsx
 M app/transparencia/page.tsx
 M components/top-nav.tsx
 M lib/env.ts
 M package-lock.json
 M package.json
 M tsconfig.tsbuildinfo
 M types/database.ts
?? app/admin/snapshots/
?? app/api/
?? app/comparativos/
?? app/snapshots/
?? app/territorio/
?? app/timeline/
?? components/comparison/
?? components/filters/
?? components/map/
?? components/reports/
?? components/snapshots/
?? components/territory/
?? components/timeline/
?? components/transparency/
?? docs/T03_REPORT_CREATION.md
?? docs/T04_PUBLIC_MAP.md
?? docs/T05_COMMUNITY_VERIFICATION.md
?? docs/T06_MODERATION.md
?? docs/T07_PRIVATE_PHOTOS.md
?? docs/T08_TRANSPARENCY_EXPORTS.md
?? docs/T09_TERRITORIAL_PRIORITIES.md
?? docs/T10_TIME_WINDOWS_AND_SNAPSHOTS.md
?? docs/T11B_MATERIALIZED_SNAPSHOTS.md
?? docs/T11_PERIOD_DELTAS.md
?? docs/T12_TIMELINE_HOTSPOTS.md
?? lib/auth/
?? lib/domain/
?? lib/filters/
?? lib/reports/
?? lib/snapshots/
?? lib/storage/
?? reports/2026-03-06-1854-T03-report-creation.md
?? reports/2026-03-06-1855-T03-report-creation.md
?? reports/2026-03-06-1904-T04-public-map.md
?? reports/2026-03-06-1905-T04-public-map.md
?? reports/2026-03-06-1907-T04-public-map.md
?? reports/2026-03-06-1922-T05-community-verification.md
?? reports/2026-03-06-1924-T05-community-verification.md
?? reports/2026-03-06-1936-T06-moderation.md
?? reports/2026-03-06-1956-T07-private-photos.md
?? reports/2026-03-06-1957-T07-private-photos.md
?? reports/2026-03-06-2010-T08-transparency-exports.md
?? reports/2026-03-06-2021-T09-territorial-priorities.md
?? reports/2026-03-06-2022-T09-territorial-priorities.md
?? reports/2026-03-06-2023-T09-territorial-priorities.md
?? reports/2026-03-09-0042-T10-time-windows-and-snapshots.md
?? reports/2026-03-09-1031-T11-period-deltas.md
?? reports/2026-03-09-1104-T11b-materialized-snapshots.md
?? reports/2026-03-09-1105-T11b-materialized-snapshots.md
?? supabase/sql/T03_reports_and_dedupe.sql
?? supabase/sql/T04_public_map.sql
?? supabase/sql/T05_verifications.sql
?? supabase/sql/T06_moderation.sql
?? supabase/sql/T07_storage_notes.sql
?? supabase/sql/T08_transparency_exports.sql
?? supabase/sql/T09_territorial_priorities.sql
?? supabase/sql/T10_time_windows_and_snapshots.sql
?? supabase/sql/T11_period_deltas.sql
?? supabase/sql/T11b_materialized_snapshots.sql
?? supabase/sql/T12_timeline_hotspots.sql
?? tools/T03_verify.ps1
?? tools/T04_verify.ps1
?? tools/T05_verify.ps1
?? tools/T06_verify.ps1
?? tools/T07_verify.ps1
?? tools/T08_verify.ps1
?? tools/T09_verify.ps1
?? tools/T10_verify.ps1

### Estrategia escolhida para timeline
- Reaproveitar filtros temporais existentes (days) e adicionar bucket (day/week) sem dependencias de grafico pesado.
- Usar componentes visuais simples em barras/listas para priorizar estabilidade do App Router.
- Basear a leitura apenas em registros published.

### Estrategia escolhida para hotspot_score
- Indice simples e explicito: volume + verificacoes + bloqueios + bonus de recencia.
- Formula base: count*1 + verified*1.5 + blocked*2 + recent_bonus.
- Uso recomendado: priorizacao operacional, nao inferencia causal.

## VERIFY
### stdout/stderr resumido de lint
`
> eslint . --max-warnings=0
`

### stdout/stderr resumido de typecheck
`
no typecheck errors
`

### stdout/stderr resumido de build
`
Ô£ô Compiled successfully in 4.9s
Route (app)                                     Size  First Load JS
Ôö£ ãÆ /auth/error                                175 B         106 kB
`

### Checklist de arquivos esperados
- [x] supabase/sql/T12_timeline_hotspots.sql
- [x] lib/reports/get-timeline-series.ts
- [x] lib/reports/get-timeline-condition-series.ts
- [x] lib/reports/get-temporal-hotspots.ts
- [x] lib/reports/get-map-hotspots.ts
- [x] app/timeline/page.tsx
- [x] components/timeline/timeline-series-chart.tsx
- [x] components/timeline/timeline-condition-chart.tsx
- [x] components/timeline/hotspots-list.tsx
- [x] components/timeline/bucket-toggle.tsx
- [x] components/timeline/timeline-methodology-note.tsx
- [x] app/api/exports/timeline.csv/route.ts
- [x] docs/T12_TIMELINE_HOTSPOTS.md

## Leitura fria do estado atual
### O que timeline + hotspots ja fazem de verdade
- Exibem ritmo temporal por bucket dia/semana com publicados/verificados/bloqueados.
- Exibem serie por condicao ao longo do tempo.
- Exibem hotspots temporais por bairro e condicao com score explicito.
- Integram navegacao com mapa, territorio e comparativos.
- Permitem export CSV publico da serie temporal.

### O que depende de env/sql/dados
- Sem env Supabase: UI entra em modo informativo sem quebrar.
- Sem SQL T12 aplicado: retorna estado pc-missing e orientacao de aplicacao.
- Sem dados publicados: exibicao de estado vazio sem erro de runtime.

### Riscos remanescentes
- hotspot_score ainda e heuristico inicial (nao modelo estatistico).
- Bucket semanal pode esconder variacoes diarias abruptas.
- Qualidade de recortes por bairro depende da consistencia textual de 
eighborhood.

## NEXT
- T12b: automacao diaria/semanal de snapshots.
- ou T13: alertas automaticos por bairro/condicao.
