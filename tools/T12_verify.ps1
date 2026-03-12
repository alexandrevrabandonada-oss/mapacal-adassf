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
$reportPath = "$reportDir/$timestamp-T12-timeline-hotspots.md"

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
  "supabase/sql/T12_timeline_hotspots.sql",
  "lib/reports/get-timeline-series.ts",
  "lib/reports/get-timeline-condition-series.ts",
  "lib/reports/get-temporal-hotspots.ts",
  "lib/reports/get-map-hotspots.ts",
  "app/timeline/page.tsx",
  "components/timeline/timeline-series-chart.tsx",
  "components/timeline/timeline-condition-chart.tsx",
  "components/timeline/hotspots-list.tsx",
  "components/timeline/bucket-toggle.tsx",
  "components/timeline/timeline-methodology-note.tsx",
  "app/api/exports/timeline.csv/route.ts",
  "docs/T12_TIMELINE_HOTSPOTS.md"
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
# T12 Timeline Hotspots Report

## Objetivo
Entregar a primeira camada publica de timeline visual e hotspots temporais com ponte para mapa, territorio e comparativos, preservando degradacao segura e estabilidade de build.

## DIAG
### Arquivos criados/alterados
$(($changed | Select-Object -First 80) -join "`n")

### Estrategia escolhida para timeline
- Reaproveitar filtros temporais existentes (`days`) e adicionar bucket (`day`/`week`) sem dependencias de grafico pesado.
- Usar componentes visuais simples em barras/listas para priorizar estabilidade do App Router.
- Basear a leitura apenas em registros `published`.

### Estrategia escolhida para hotspot_score
- Indice simples e explicito: volume + verificacoes + bloqueios + bonus de recencia.
- Formula base: `count*1 + verified*1.5 + blocked*2 + recent_bonus`.
- Uso recomendado: priorizacao operacional, nao inferencia causal.

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
### O que timeline + hotspots ja fazem de verdade
- Exibem ritmo temporal por bucket dia/semana com publicados/verificados/bloqueados.
- Exibem serie por condicao ao longo do tempo.
- Exibem hotspots temporais por bairro e condicao com score explicito.
- Integram navegacao com mapa, territorio e comparativos.
- Permitem export CSV publico da serie temporal.

### O que depende de env/sql/dados
- Sem env Supabase: UI entra em modo informativo sem quebrar.
- Sem SQL T12 aplicado: retorna estado `rpc-missing` e orientacao de aplicacao.
- Sem dados publicados: exibicao de estado vazio sem erro de runtime.

### Riscos remanescentes
- hotspot_score ainda e heuristico inicial (nao modelo estatistico).
- Bucket semanal pode esconder variacoes diarias abruptas.
- Qualidade de recortes por bairro depende da consistencia textual de `neighborhood`.

## NEXT
- T12b: automacao diaria/semanal de snapshots.
- ou T13: alertas automaticos por bairro/condicao.
"@

$report | Out-File -FilePath $reportPath -Encoding utf8
Write-Ok "report generated: $reportPath"

if ($hasError) {
  exit 1
}

exit 0
