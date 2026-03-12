# Relatório Final T12c: External Scheduler (Micro-Hotfix)
Gerado em: 2026-03-09 21:45:22

## Objetivo
Aplicar correções finais no T12c-b removendo a variável _error não utilizada e corrigindo os warnings de **Dynamic server usage** no build das páginas de snapshots materializados. O objetivo é entregar um build verde sem warnings dinâmicos.

## DIAG
- pp/api/cron/snapshot-jobs/route.ts possuía catch (_error).
- Páginas de /snapshots/materializados/* dependiam da chamada ao Supabase com validação de Role/Moderator (cookies), o que força o Next a torná-las rotas dinâmicas silenciosamente, gerando warnings no build ao tentar renderização estática.

## PATCH
- Removido _error do catch block em oute.ts. O Next e o Eslint agora não reclamam de var não usada.
- Adicionada constraint xport const dynamic = "force-dynamic"; no topo das páginas:
  - pp/snapshots/materializados/diffs/page.tsx
  - pp/snapshots/materializados/territorio/page.tsx
  - pp/snapshots/materializados/transparencia/page.tsx
- Build agora deve passar de primeira sem cuspir log de erro estático.

## VERIFY

### Lint Status
`	ext
> mapa-calcadas-sf@0.1.0 lint
> eslint . --max-warnings=0
`

### Typecheck Status
`	ext
> mapa-calcadas-sf@0.1.0 typecheck
> tsc --noEmit
`

### Build Status
`	ext
> mapa-calcadas-sf@0.1.0 build
> next build
   Ôû▓ Next.js 15.5.12
   Creating an optimized production build ...
 Ô£ô Compiled successfully in 7.3s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/41) ...
   Generating static pages (10/41) 
   Generating static pages (20/41) 
   Generating static pages (30/41) 
 Ô£ô Generating static pages (41/41)
   Finalizing page optimization ...
   Collecting build traces ...
Route (app)                                     Size  First Load JS
Ôöî Ôùï /                                          175 B         106 kB
Ôö£ Ôùï /_not-found                                997 B         103 kB
Ôö£ Ôùï /admin/moderacao                         3.33 kB         114 kB
Ôö£ Ôùï /admin/snapshot-jobs                     3.44 kB         109 kB
Ôö£ Ôùï /admin/snapshots                          4.4 kB         110 kB
Ôö£ ãÆ /api/admin/snapshot-jobs/list              193 B         102 kB
Ôö£ ãÆ /api/admin/snapshot-jobs/run               193 B         102 kB
Ôö£ ãÆ /api/admin/snapshot-jobs/run-all           193 B         102 kB
Ôö£ ãÆ /api/admin/snapshot-jobs/runs              193 B         102 kB
Ôö£ ãÆ /api/admin/snapshots/create                193 B         102 kB
Ôö£ ãÆ /api/admin/snapshots/diff/create           193 B         102 kB
Ôö£ ãÆ /api/admin/snapshots/diffs/list            193 B         102 kB
Ôö£ ãÆ /api/admin/snapshots/list                  193 B         102 kB
Ôö£ ãÆ /api/admin/snapshots/state                 193 B         102 kB
Ôö£ ãÆ /api/cron/snapshot-jobs                    193 B         102 kB
Ôö£ ãÆ /api/exports/deltas.csv                    193 B         102 kB
Ôö£ ãÆ /api/exports/reports.csv                   193 B         102 kB
Ôö£ ãÆ /api/exports/reports.geojson               193 B         102 kB
Ôö£ ãÆ /api/exports/snapshot.json                 193 B         102 kB
Ôö£ ãÆ /api/exports/timeline.csv                  193 B         102 kB
Ôö£ ãÆ /api/reports/confirm                       193 B         102 kB
Ôö£ ãÆ /api/reports/create                        193 B         102 kB
Ôö£ ãÆ /api/reports/moderate                      193 B         102 kB
Ôö£ ãÆ /api/reports/moderation-list               193 B         102 kB
Ôö£ ãÆ /api/reports/nearby                        193 B         102 kB
Ôö£ ãÆ /api/reports/photo/signed                  193 B         102 kB
Ôö£ ãÆ /api/reports/photo/upload                  193 B         102 kB
Ôö£ ãÆ /auth/callback                             193 B         102 kB
Ôö£ ãÆ /auth/error                                175 B         106 kB
Ôö£ ãÆ /comparativos                            3.46 kB         109 kB
Ôö£ Ôùï /login                                   2.27 kB         162 kB
Ôö£ Ôùï /manifest.webmanifest                      193 B         102 kB
Ôö£ ãÆ /mapa                                    1.95 kB         108 kB
Ôö£ Ôùï /novo                                    4.96 kB         170 kB
Ôö£ ãÆ /r/[id]                                  1.29 kB         112 kB
Ôö£ ãÆ /snapshots/diffs/[id]                      172 B         106 kB
Ôö£ ãÆ /snapshots/materializados/diffs            175 B         106 kB
Ôö£ ãÆ /snapshots/materializados/territorio       922 B         107 kB
Ôö£ ãÆ /snapshots/materializados/transparencia    922 B         107 kB
Ôö£ ãÆ /snapshots/territorio                      175 B         106 kB
Ôö£ ãÆ /snapshots/territorio/[id]                 172 B         106 kB
Ôö£ ãÆ /snapshots/transparencia                 1.59 kB         107 kB
Ôö£ ãÆ /snapshots/transparencia/[id]              172 B         106 kB
Ôö£ ãÆ /territorio                              1.34 kB         107 kB
Ôö£ ãÆ /timeline                                1.05 kB         107 kB
Ôöö ãÆ /transparencia                           2.63 kB         108 kB
+ First Load JS shared by all                 102 kB
  Ôö£ chunks/1255-a390e12b70b4a9fb.js            46 kB
  Ôö£ chunks/4bd1b696-f785427dddbba9fb.js      54.2 kB
  Ôöö other shared chunks (total)              2.06 kB
ãÆ Middleware                                 85.1 kB
Ôùï  (Static)   prerendered as static content
ãÆ  (Dynamic)  server-rendered on demand
`

## Leitura fria
- Todas as regras observadas. As rotas dinâmicas não alteram funcionalidade, apenas suprimem adequadamente os warnings de PRERENDER do Next.js.
- O T12c pode agora ser dado como 100% verde e fechado.

## NEXT
- **T12d**: diff automático pós-snapshot
- **T13**: alertas automáticos por bairro/condição
