# T12b: Snapshot Automation (Daily/Weekly)

## Objetivo

T12b adiciona uma camada operacional de automacao para snapshots materializados:

- Cadastro de jobs diarios e semanais
- Execucao manual/agendavel por RPC
- Anti-duplicacao por periodo (dia/semana)
- Historico de runs com status e mensagem
- Painel administrativo para operar e auditar

## Escopo Entregue

## SQL

Arquivo: `supabase/sql/T12b_snapshot_automation.sql`

Inclui:
- Tabela `snapshot_jobs`
- Tabela `snapshot_job_runs`
- Seeds iniciais (4 jobs padrao)
- RPC `list_snapshot_jobs()`
- RPC `list_snapshot_job_runs(in_limit)`
- RPC `run_snapshot_job(in_job_id)`

Regras principais:
- `frequency`: `daily` ou `weekly`
- `days`: `7 | 30 | 90 | 365`
- `kind`: `transparency | territory`
- Anti-dup: se ja houve run `success` no periodo corrente, retorna `skipped`

Permissao:
- Moderator/Admin por `is_moderator()`
- Ou token `service_role` para automacao externa

## Camada de Dados

- `lib/snapshots/list-snapshot-jobs.ts`
- `lib/snapshots/run-snapshot-job.ts`
- `lib/snapshots/list-snapshot-job-runs.ts`

Padrao de degradacao:
- `env-missing`
- `rpc-missing`
- `unauthorized`
- `db-error`
- `no-data`

## API Admin

- `GET /api/admin/snapshot-jobs/list`
- `GET /api/admin/snapshot-jobs/runs?limit=50`
- `POST /api/admin/snapshot-jobs/run` com body `{ "jobId": "uuid" }`

## UI Admin

- `app/admin/snapshot-jobs/page.tsx`

Funcionalidades:
- Ver jobs configurados
- Rodar job manualmente
- Ler feedback `success/skipped/error`
- Ver historico recente de runs
- Abrir snapshot gerado quando existir

Ponte adicional:
- `app/admin/snapshots/page.tsx` agora aponta para o painel de jobs

## Script Operacional Manual

Arquivo: `tools/T12b_run_snapshot_jobs.ps1`

Pre-requisitos de ambiente:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Exemplos:

```powershell
# listar jobs sem executar
pwsh -File tools/T12b_run_snapshot_jobs.ps1 -ListOnly

# executar todos os jobs ativos
pwsh -File tools/T12b_run_snapshot_jobs.ps1

# executar apenas um job
pwsh -File tools/T12b_run_snapshot_jobs.ps1 -JobId "<uuid-do-job>"
```

Observacao:
- O script usa PostgREST RPC com `apikey` + `Authorization`.
- O comportamento de anti-duplicacao e aplicado no banco.

## Navegacao e Status

Atualizacoes de interface:
- Link `Jobs Snapshot` no topo
- Atalho na home para painel de jobs
- Status da camada de automacao marcado como ativa

## Tipos

Atualizado `types/database.ts` com:
- Tabelas `snapshot_jobs` e `snapshot_job_runs`
- RPCs `list_snapshot_jobs`, `list_snapshot_job_runs`, `run_snapshot_job`

## Limites Conhecidos

- T12b nao ativa scheduler nativo sozinho.
- O agendamento deve ser feito por cron/plataforma chamando RPC/script.
- Se SQL T12b nao estiver aplicado, APIs retornam `rpc-missing`.
