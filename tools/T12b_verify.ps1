#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$text)
  Write-Host "[STEP] $text"
}

function Write-Ok {
  param([string]$text)
  Write-Host "[OK] $text" -ForegroundColor Green
}

function Write-Fail {
  param([string]$text)
  Write-Host "[FAIL] $text" -ForegroundColor Red
}

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportDir = "reports"
$reportPath = "$reportDir/$timestamp-T12b-snapshot-automation.md"

if (-not (Test-Path $reportDir)) {
  New-Item -ItemType Directory -Path $reportDir | Out-Null
}

$hasError = $false

Write-Step "DIAG bootstrap"
if (Test-Path "tools/_bootstrap.ps1") {
  . "tools/_bootstrap.ps1"
  Write-Ok "tools/_bootstrap.ps1 loaded"
} else {
  Write-Ok "tools/_bootstrap.ps1 not found (optional)"
}

Write-Step "npm install"
$null = npm install 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "npm install ok"
} else {
  Write-Fail "npm install failed"
  $hasError = $true
}

Write-Step "npm run lint"
$lintOutput = npm run lint 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "lint ok"
} else {
  Write-Fail "lint failed"
  $hasError = $true
}

Write-Step "npm run typecheck"
$typeOutput = npm run typecheck 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "typecheck ok"
} else {
  Write-Fail "typecheck failed"
  $hasError = $true
}

Write-Step "npm run build"
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "build ok"
} else {
  Write-Fail "build failed"
  $hasError = $true
}

Write-Step "check expected files"
$expectedFiles = @(
  "supabase/sql/T12b_snapshot_automation.sql",
  "lib/snapshots/list-snapshot-jobs.ts",
  "lib/snapshots/run-snapshot-job.ts",
  "lib/snapshots/list-snapshot-job-runs.ts",
  "app/api/admin/snapshot-jobs/list/route.ts",
  "app/api/admin/snapshot-jobs/run/route.ts",
  "app/api/admin/snapshot-jobs/runs/route.ts",
  "app/admin/snapshot-jobs/page.tsx",
  "tools/T12b_run_snapshot_jobs.ps1",
  "docs/T12B_SNAPSHOT_AUTOMATION.md",
  "tools/T12b_verify.ps1"
)

$missingFiles = @()
$fileChecklist = @()
foreach ($file in $expectedFiles) {
  if (Test-Path -LiteralPath $file) {
    $fileChecklist += "- [x] $file"
  } else {
    $fileChecklist += "- [ ] $file"
    $missingFiles += $file
  }
}

if ($missingFiles.Count -gt 0) {
  Write-Fail "missing files: $($missingFiles.Count)"
  $hasError = $true
} else {
  Write-Ok "expected files present"
}

$lintSummary = ($lintOutput | Select-String -Pattern "error|warning" | Select-Object -First 12 | Out-String).Trim()
if (-not $lintSummary) { $lintSummary = "no lint errors/warnings" }

$typeSummary = ($typeOutput | Select-String -Pattern "error TS|Cannot find|Type error" | Select-Object -First 12 | Out-String).Trim()
if (-not $typeSummary) { $typeSummary = "no typecheck errors" }

$buildSummary = ($buildOutput | Select-String -Pattern "Failed to compile|error|Compiled successfully|Route" | Select-Object -First 20 | Out-String).Trim()
if (-not $buildSummary) { $buildSummary = "build output captured" }

$changed = @()
try {
  $changed = @(git status --short)
} catch {
  $changed = @("git status indisponivel")
}

$report = @"
# T12b Snapshot Automation Report

## Objetivo
Entregar camada operacional para snapshots diarios e semanais com anti-duplicacao por periodo, historico auditavel e painel admin de execucao manual/agendavel.

## DIAG
### Arquivos criados/alterados
$(($changed | Select-Object -First 100) -join "`n")

### Estrategia escolhida para automacao
- Definir jobs persistidos (`snapshot_jobs`) com parametros estaveis (kind/frequency/days/neighborhood).
- Registrar cada tentativa em `snapshot_job_runs` para trilha auditavel.
- Centralizar regra anti-duplicacao no banco (`run_snapshot_job`) para evitar corrida de chamadas externas.
- Permitir operacao por moderator/admin e por `service_role` para integracao com scheduler externo.

## VERIFY
### stdout/stderr resumido de lint
```
$lintSummary
```

### stdout/stderr resumido de typecheck
```
$typeSummary
```

### stdout/stderr resumido de build
```
$buildSummary
```

### Checklist de arquivos esperados
$($fileChecklist -join "`n")

## Leitura fria do estado atual
### O que T12b ja faz de verdade
- Lista jobs configurados e historico de runs.
- Executa job manualmente com retorno `success`, `skipped` ou `error`.
- Aplica anti-duplicacao diaria/semanal com base em sucesso no periodo.
- Exibe trilha operacional no painel `/admin/snapshot-jobs`.
- Permite execucao local via `tools/T12b_run_snapshot_jobs.ps1`.

### O que depende de env/sql/dados
- Sem env Supabase: APIs/UI degradam com mensagem de indisponibilidade.
- Sem SQL T12b aplicado: camada retorna `rpc-missing`.
- Sem chave service role no script operacional: execucao local falha por pre-condicao.

### Riscos remanescentes
- Agendamento automatico continuo depende de cron/plataforma externa.
- `title_template` usa token simples `{{date}}`; variacoes extras exigem evolucao de parser.
- Jobs por bairro dependem da consistencia textual de `neighborhood`.

## NEXT
- Integrar scheduler externo (GitHub Actions/cron/Vercel cron) chamando o script ou RPC.
- Evoluir painel com toggle de `is_enabled` e criacao/edicao de jobs.
"@

$report | Out-File -FilePath $reportPath -Encoding utf8
Write-Ok "report generated: $reportPath"

if ($hasError) {
  exit 1
}

exit 0
