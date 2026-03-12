# T11b Materialized Snapshots Report

## Objetivo
Entregar snapshots materializados e diffs congelados com paginas publicas estaveis por id, admin operacional e degrade seguro sem depender de dados reais para lint/typecheck/build.

## DIAG
### Arquivos criados/alterados
supabase/sql/T11b_materialized_snapshots.sql
lib/snapshots/*.ts
components/snapshots/*.tsx
app/admin/snapshots/page.tsx
app/snapshots/**
app/api/admin/snapshots/**
app/api/exports/snapshot.json/route.ts
types/database.ts
docs/T11B_MATERIALIZED_SNAPSHOTS.md
tools/T11b_verify.ps1

### Estrategia escolhida para materializacao
- Persistir snapshots em public.public_snapshots com data em jsonb publico, enxuto e estavel.
- Expor leitura publica apenas para is_public = true.
- Criacao via RPC create_public_snapshot com exigencia de autenticacao e role moderator/admin.

### Estrategia escolhida para diffs congelados
- Persistir diffs em public.public_snapshot_diffs referenciando snapshot A e B.
- Expor leitura publica apenas para is_public = true.
- Criacao via RPC create_public_snapshot_diff validando mesmo kind e snapshots distintos.
- Percentuais/deltas relativos devem ser nulos quando baseline for zero para evitar distorcao.

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
Ô£ô Compiled successfully in 4.3s
Route (app)                                     Size  First Load JS
Ôö£ ãÆ /auth/error                                175 B         106 kB
`

### Checklist de arquivos esperados
- [x] supabase/sql/T11b_materialized_snapshots.sql
- [x] lib/snapshots/create-public-snapshot.ts
- [x] lib/snapshots/list-public-snapshots.ts
- [x] lib/snapshots/get-public-snapshot-by-id.ts
- [x] lib/snapshots/create-public-snapshot-diff.ts
- [x] lib/snapshots/list-public-snapshot-diffs.ts
- [x] lib/snapshots/get-public-snapshot-diff-by-id.ts
- [x] app/admin/snapshots/page.tsx
- [x] app/snapshots/transparencia/[id]/page.tsx
- [x] app/snapshots/territorio/[id]/page.tsx
- [x] app/snapshots/diffs/[id]/page.tsx
- [x] app/api/exports/snapshot.json/route.ts
- [x] docs/T11B_MATERIALIZED_SNAPSHOTS.md

## Leitura fria do estado atual
### O que snapshots materializados ja fazem de verdade
- Criam e listam snapshots persistidos por kind (transparency/territory).
- Criam e listam diffs congelados entre snapshots compativeis.
- Entregam paginas publicas por id para snapshot e diff.
- Entregam endpoint publico de export json materializado.

### O que depende de env/sql/dados
- Sem env Supabase: UI degrada para estado informativo.
- Sem SQL T11b aplicada: RPCs retornam rpc-missing e UI orienta aplicacao do SQL.
- Sem role moderator/admin: criacao de snapshot/diff bloqueada.
- Sem dados reais: pages podem exibir estrutura com sumarios vazios.

### Riscos remanescentes
- Criacao de snapshots ainda manual (sem agenda automatica).
- Qualidade do diff depende do shape de data salvo no snapshot.
- Evolucao de schema jsonb exige controle de source_version para compatibilidade futura.

## NEXT
- T12: timeline visual + hotspots no tempo.
- ou T12b: automacao diaria/semanal de snapshots.
