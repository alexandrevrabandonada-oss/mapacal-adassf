# T03 - Report Creation

## Objetivo
- Tornar /novo um fluxo real para criar report pending com dedupe inicial e degradacao segura.

## DIAG
- Data/Hora: 2026-03-06 18:55:05
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

### `npm run typecheck` (exit 2)
```text

> mapa-calcadas-sf@0.1.0 typecheck
> tsc --noEmit

app/api/reports/create/route.ts(35,5): error TS2322: Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
app/api/reports/create/route.ts(36,5): error TS2322: Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
app/api/reports/nearby/route.ts(27,51): error TS2345: Argument of type 'number | undefined' is not assignable to parameter of type 'number'.
  Type 'undefined' is not assignable to type 'number'.
```

### `npm run build` (exit 1)
```text

> mapa-calcadas-sf@0.1.0 build
> next build

   Ôû▓ Next.js 15.5.12

   Creating an optimized production build ...
 Ô£ô Compiled successfully in 7.2s
   Linting and checking validity of types ...
Failed to compile.
System.Management.Automation.RemoteException
./app/api/reports/create/route.ts:35:5
Type error: Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
System.Management.Automation.RemoteException
[0m [90m 33 |[39m   [36mconst[39m result [33m=[39m [36mawait[39m createPendingReport({
 [90m 34 |[39m     condition[33m:[39m body[33m.[39mcondition[33m,[39m
[31m[1m>[22m[39m[90m 35 |[39m     lat[33m:[39m body[33m.[39mlat[33m,[39m
 [90m    |[39m     [31m[1m^[22m[39m
 [90m 36 |[39m     lng[33m:[39m body[33m.[39mlng[33m,[39m
 [90m 37 |[39m     neighborhood[33m:[39m body[33m.[39mneighborhood[33m,[39m
 [90m 38 |[39m     note[33m:[39m body[33m.[39mnote[33m,[39m[0m
Next.js build worker exited with code: 1 and signal: null
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
- Falhas detectadas:
  - npm run typecheck falhou
  - npm run build falhou