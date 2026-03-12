# T03 - Report Creation

## Objetivo
- Tornar /novo um fluxo real para criar report pending com dedupe inicial e degradacao segura.

## DIAG
- Data/Hora: 2026-03-06 18:56:19
- PWD: C:\Projetos\Mapa Calçadas SF
- Estrategia escolhida: Route handlers POST em app/api/reports/create e app/api/reports/nearby
- Arquivos criados/alterados (git status --short):
  -  M app/novo/page.tsx
  -  M tsconfig.tsbuildinfo
  -  M types/database.ts
  - ?? app/api/
  - ?? docs/T03_REPORT_CREATION.md
  - ?? lib/domain/
  - ?? lib/reports/
  - ?? reports/2026-03-06-1854-T03-report-creation.md
  - ?? supabase/sql/T03_reports_and_dedupe.sql
  - ?? tools/T03_verify.ps1
  - ?? tools/_patch_backup/20260306-185107-app_novo_page.tsx
  - ?? tools/_patch_backup/20260306-185107-types_database.ts
- Estrutura relevante app/novo:
  - C:\Projetos\Mapa Calçadas SF\app\novo\page.tsx
- Estrutura relevante lib/supabase:
  - C:\Projetos\Mapa Calçadas SF\lib\supabase\client.ts
  - C:\Projetos\Mapa Calçadas SF\lib\supabase\middleware.ts
  - C:\Projetos\Mapa Calçadas SF\lib\supabase\server.ts

## VERIFY
### `npm run lint` (exit 0)
```text

> mapa-calcadas-sf@0.1.0 lint
> eslint . --max-warnings=0

```

### `npm run typecheck` (exit 0)
```text

> mapa-calcadas-sf@0.1.0 typecheck
> tsc --noEmit

```

### `npm run build` (exit 0)
```text

> mapa-calcadas-sf@0.1.0 build
> next build

   Ôû▓ Next.js 15.5.12

   Creating an optimized production build ...
 Ô£ô Compiled successfully in 4.3s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/14) ...
   Generating static pages (3/14) 
   Generating static pages (6/14) 
   Generating static pages (10/14) 
 Ô£ô Generating static pages (14/14)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
Ôöî Ôùï /                                      163 B         106 kB
Ôö£ Ôùï /_not-found                            992 B         103 kB
Ôö£ Ôùï /admin/moderacao                       170 B         106 kB
Ôö£ ãÆ /api/reports/create                    131 B         102 kB
Ôö£ ãÆ /api/reports/nearby                    131 B         102 kB
Ôö£ ãÆ /auth/callback                         131 B         102 kB
Ôö£ ãÆ /auth/error                            163 B         106 kB
Ôö£ Ôùï /login                               2.15 kB         161 kB
Ôö£ Ôùï /manifest.webmanifest                  131 B         102 kB
Ôö£ Ôùï /mapa                                  170 B         106 kB
Ôö£ Ôùï /novo                                4.17 kB         163 kB
Ôö£ ãÆ /r/[id]                                170 B         106 kB
Ôöö Ôùï /transparencia                         170 B         106 kB
+ First Load JS shared by all             102 kB
  Ôö£ chunks/255-ebd51be49873d76c.js         46 kB
  Ôö£ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  Ôöö other shared chunks (total)          1.99 kB


ãÆ Middleware                             85.1 kB

Ôùï  (Static)   prerendered as static content
ãÆ  (Dynamic)  server-rendered on demand

```

### Checklist de arquivos esperados
- [OK] lib/domain/sidewalk.ts
- [OK] lib/reports/create-report.ts
- [OK] lib/reports/find-nearby.ts
- [OK] app/novo/page.tsx
- [OK] supabase/sql/T03_reports_and_dedupe.sql
- [OK] docs/T03_REPORT_CREATION.md
- [OK] app/api/reports/create/route.ts
- [OK] app/api/reports/nearby/route.ts

## Leitura fria do estado atual
- /novo cria report real em sidewalk_reports com status pending.
- /novo vincula tags opcionais em sidewalk_report_tags.
- Dedupe inicial via RPC nearby_sidewalk_reports, com fallback amigavel se RPC nao existir.
- Sem env, sem auth ou sem SQL aplicado: UI nao quebra e mostra estado explicito.
- Fora de escopo neste tijolo: upload de foto e mapa real.

## NEXT
- T04: mapa + listagem published + clusters fake/real bridge
- Alternativa: T03b upload privado de foto se fluxo textual estiver solido