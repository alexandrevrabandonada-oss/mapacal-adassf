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
$reportPath = "$reportDir/$timestamp-T11b-materialized-snapshots.md"

if (-not (Test-Path $reportDir)) {
  New-Item -ItemType Directory -Path $reportDir | Out-Null
}

$diagNotes = @()
$verifyNotes = @()
$hasError = $false

Write-Step "DIAG bootstrap"
if (Test-Path "tools/_bootstrap.ps1") {
  . "tools/_bootstrap.ps1"
  Write-Ok "tools/_bootstrap.ps1 loaded"
  $diagNotes += "- bootstrap: loaded"
} else {
  Write-Ok "tools/_bootstrap.ps1 not found (optional)"
  $diagNotes += "- bootstrap: not found (optional)"
}

Write-Step "npm install"
$null = npm install 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "npm install ok"
  $verifyNotes += "- npm install: ok"
} else {
  Write-Fail "npm install failed"
  $hasError = $true
  $verifyNotes += "- npm install: failed"
}

Write-Step "npm run lint"
$lintOutput = npm run lint 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "lint ok"
  $verifyNotes += "- lint: ok"
} else {
  Write-Fail "lint failed"
  $hasError = $true
  $verifyNotes += "- lint: failed"
}

Write-Step "npm run typecheck"
$typeOutput = npm run typecheck 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "typecheck ok"
  $verifyNotes += "- typecheck: ok"
} else {
  Write-Fail "typecheck failed"
  $hasError = $true
  $verifyNotes += "- typecheck: failed"
}

Write-Step "npm run build"
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Ok "build ok"
  $verifyNotes += "- build: ok"
} else {
  Write-Fail "build failed"
  $hasError = $true
  $verifyNotes += "- build: failed"
}

Write-Step "check expected files"
$expectedFiles = @(
  "supabase/sql/T11b_materialized_snapshots.sql",
  "lib/snapshots/create-public-snapshot.ts",
  "lib/snapshots/list-public-snapshots.ts",
  "lib/snapshots/get-public-snapshot-by-id.ts",
  "lib/snapshots/create-public-snapshot-diff.ts",
  "lib/snapshots/list-public-snapshot-diffs.ts",
  "lib/snapshots/get-public-snapshot-diff-by-id.ts",
  "app/admin/snapshots/page.tsx",
  "app/snapshots/transparencia/[id]/page.tsx",
  "app/snapshots/territorio/[id]/page.tsx",
  "app/snapshots/diffs/[id]/page.tsx",
  "app/api/exports/snapshot.json/route.ts",
  "docs/T11B_MATERIALIZED_SNAPSHOTS.md"
)

$missing = @()
foreach ($file in $expectedFiles) {
  if (-not (Test-Path -LiteralPath $file)) {
    $missing += $file
  }
}

if ($missing.Count -eq 0) {
  Write-Ok "expected files present"
} else {
  Write-Fail "missing files: $($missing.Count)"
  $hasError = $true
}

$lintSummary = ($lintOutput | Select-String -Pattern "error|warning" | Select-Object -First 10 | Out-String).Trim()
if (-not $lintSummary) { $lintSummary = "no lint errors/warnings" }

$typeSummary = ($typeOutput | Select-String -Pattern "error TS|Cannot find|Type error" | Select-Object -First 10 | Out-String).Trim()
if (-not $typeSummary) { $typeSummary = "no typecheck errors" }

$buildSummary = ($buildOutput | Select-String -Pattern "Failed to compile|error|Compiled successfully|Route" | Select-Object -First 20 | Out-String).Trim()
if (-not $buildSummary) { $buildSummary = "build output captured" }

$fileChecklist = @()
foreach ($file in $expectedFiles) {
  if (Test-Path -LiteralPath $file) {
    $fileChecklist += "- [x] $file"
  } else {
    $fileChecklist += "- [ ] $file"
  }
}

$createdOrChanged = @(
  "supabase/sql/T11b_materialized_snapshots.sql",
  "lib/snapshots/*.ts",
  "components/snapshots/*.tsx",
  "app/admin/snapshots/page.tsx",
  "app/snapshots/**",
  "app/api/admin/snapshots/**",
  "app/api/exports/snapshot.json/route.ts",
  "types/database.ts",
  "docs/T11B_MATERIALIZED_SNAPSHOTS.md",
  "tools/T11b_verify.ps1"
)

$report = @"
# T11b Materialized Snapshots Report

## Objetivo
Entregar snapshots materializados e diffs congelados com paginas publicas estaveis por id, admin operacional e degrade seguro sem depender de dados reais para lint/typecheck/build.

## DIAG
### Arquivos criados/alterados
$($createdOrChanged -join "`n")

### Estrategia escolhida para materializacao
- Persistir snapshots em `public.public_snapshots` com `data` em jsonb publico, enxuto e estavel.
- Expor leitura publica apenas para `is_public = true`.
- Criacao via RPC `create_public_snapshot` com exigencia de autenticacao e role moderator/admin.

### Estrategia escolhida para diffs congelados
- Persistir diffs em `public.public_snapshot_diffs` referenciando snapshot A e B.
- Expor leitura publica apenas para `is_public = true`.
- Criacao via RPC `create_public_snapshot_diff` validando mesmo kind e snapshots distintos.
- Percentuais/deltas relativos devem ser nulos quando baseline for zero para evitar distorcao.

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
- Qualidade do diff depende do shape de `data` salvo no snapshot.
- Evolucao de schema jsonb exige controle de `source_version` para compatibilidade futura.

## NEXT
- T12: timeline visual + hotspots no tempo.
- ou T12b: automacao diaria/semanal de snapshots.
"@

$report | Out-File -FilePath $reportPath -Encoding utf8
Write-Ok "report generated: $reportPath"

if ($hasError) {
  exit 1
}

exit 0
