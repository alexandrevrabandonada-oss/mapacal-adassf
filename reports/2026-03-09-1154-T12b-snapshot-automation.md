# T12b Snapshot Automation Report

## Objetivo
Entregar camada operacional para snapshots diarios e semanais com anti-duplicacao por periodo, historico auditavel e painel admin de execucao manual/agendavel.

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
?? app/admin/snapshot-jobs/
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
?? docs/T12B_SNAPSHOT_AUTOMATION.md
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
?? reports/2026-03-09-1138-T12-timeline-hotspots.md
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
?? supabase/sql/T12b_snapshot_automation.sql
?? tools/T03_verify.ps1
?? tools/T04_verify.ps1
?? tools/T05_verify.ps1
?? tools/T06_verify.ps1
?? tools/T07_verify.ps1
?? tools/T08_verify.ps1
?? tools/T09_verify.ps1
?? tools/T10_verify.ps1
?? tools/T11_verify.ps1
?? tools/T11b_verify.ps1
?? tools/T12_verify.ps1
?? tools/T12b_run_snapshot_jobs.ps1
?? tools/T12b_verify.ps1
?? tools/_patch_backup/20260306-185107-app_novo_page.tsx
?? tools/_patch_backup/20260306-185107-types_database.ts
?? tools/_patch_backup/20260306-190022-app_mapa_page.tsx
?? tools/_patch_backup/20260306-190022-app_page.tsx
?? tools/_patch_backup/20260306-190022-package-lock.json
?? tools/_patch_backup/20260306-190022-package.json
?? tools/_patch_backup/20260306-190022-types_database.ts
?? tools/_patch_backup/20260306-190054-app_r_id_page.tsx
?? tools/_patch_backup/20260306-191504-types_database.ts
?? tools/_patch_backup/20260306-191648-app_mapa_page.tsx
?? tools/_patch_backup/20260306-191721-app_novo_page.tsx

### Estrategia escolhida para automacao
- Definir jobs persistidos (snapshot_jobs) com parametros estaveis (kind/frequency/days/neighborhood).
- Registrar cada tentativa em snapshot_job_runs para trilha auditavel.
- Centralizar regra anti-duplicacao no banco (un_snapshot_job) para evitar corrida de chamadas externas.
- Permitir operacao por moderator/admin e por service_role para integracao com scheduler externo.

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
Ô£ô Compiled successfully in 5.2s
Route (app)                                     Size  First Load JS
Ôö£ ãÆ /auth/error                                175 B         106 kB
`

### Checklist de arquivos esperados
- [x] supabase/sql/T12b_snapshot_automation.sql
- [x] lib/snapshots/list-snapshot-jobs.ts
- [x] lib/snapshots/run-snapshot-job.ts
- [x] lib/snapshots/list-snapshot-job-runs.ts
- [x] app/api/admin/snapshot-jobs/list/route.ts
- [x] app/api/admin/snapshot-jobs/run/route.ts
- [x] app/api/admin/snapshot-jobs/runs/route.ts
- [x] app/admin/snapshot-jobs/page.tsx
- [x] tools/T12b_run_snapshot_jobs.ps1
- [x] docs/T12B_SNAPSHOT_AUTOMATION.md
- [x] tools/T12b_verify.ps1

## Leitura fria do estado atual
### O que T12b ja faz de verdade
- Lista jobs configurados e historico de runs.
- Executa job manualmente com retorno success, skipped ou rror.
- Aplica anti-duplicacao diaria/semanal com base em sucesso no periodo.
- Exibe trilha operacional no painel /admin/snapshot-jobs.
- Permite execucao local via 	ools/T12b_run_snapshot_jobs.ps1.

### O que depende de env/sql/dados
- Sem env Supabase: APIs/UI degradam com mensagem de indisponibilidade.
- Sem SQL T12b aplicado: camada retorna pc-missing.
- Sem chave service role no script operacional: execucao local falha por pre-condicao.

### Riscos remanescentes
- Agendamento automatico continuo depende de cron/plataforma externa.
- 	itle_template usa token simples {{date}}; variacoes extras exigem evolucao de parser.
- Jobs por bairro dependem da consistencia textual de 
eighborhood.

## NEXT
- Integrar scheduler externo (GitHub Actions/cron/Vercel cron) chamando o script ou RPC.
- Evoluir painel com toggle de is_enabled e criacao/edicao de jobs.
