# T09_verify.ps1
# Verificacao automatizada de cobertura territorial e priorizacao

param()

$ErrorActionPreference = "Continue"

if (Test-Path "tools/_bootstrap.ps1") {
  . "tools/_bootstrap.ps1"
}

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportFile = "reports/$timestamp-T09-territorial-priorities.md"

Write-Host ""
Write-Host "=== T09 VERIFY ===" -ForegroundColor Cyan
Write-Host ""

$expectedFiles = @(
  "supabase/sql/T09_territorial_priorities.sql",
  "lib/reports/get-neighborhood-priority-breakdown.ts",
  "lib/reports/get-neighborhood-recent-alerts.ts",
  "lib/reports/get-priority-map-points.ts",
  "components/territory/priority-summary-cards.tsx",
  "components/territory/neighborhood-priority-table.tsx",
  "components/territory/recent-alerts-list.tsx",
  "components/territory/priority-score-explainer.tsx",
  "app/territorio/page.tsx",
  "docs/T09_TERRITORIAL_PRIORITIES.md",
  "tools/T09_verify.ps1"
)

$diagChanged = @(
  "app/mapa/page.tsx",
  "app/transparencia/page.tsx",
  "app/page.tsx",
  "components/map/report-filters.tsx",
  "components/map/report-map-client.tsx",
  "components/top-nav.tsx",
  "types/database.ts"
)

Write-Host "DIAG - arquivos alterados esperados:" -ForegroundColor Yellow
($expectedFiles + $diagChanged) | ForEach-Object { Write-Host "- $_" }
Write-Host ""

$filesOk = $true
$fileChecklistLines = @()
foreach ($file in $expectedFiles) {
  if (Test-Path $file) {
    $fileChecklistLines += "OK: ``$file``"
  } else {
    $fileChecklistLines += "FALTANDO: ``$file``"
    $filesOk = $false
  }
}

Write-Host "Running npm install..." -ForegroundColor Yellow
$installOutput = npm install 2>&1 | Out-String
$installExit = $LASTEXITCODE

Write-Host "Running npm run lint..." -ForegroundColor Yellow
$lintOutput = npm run lint 2>&1 | Out-String
$lintExit = $LASTEXITCODE

Write-Host "Running npm run typecheck..." -ForegroundColor Yellow
$typecheckOutput = npm run typecheck 2>&1 | Out-String
$typecheckExit = $LASTEXITCODE

Write-Host "Running npm run build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1 | Out-String
$buildExit = $LASTEXITCODE

if (-not (Test-Path "reports")) {
  New-Item -ItemType Directory -Path "reports" | Out-Null
}

$fileChecklist = $fileChecklistLines -join "`n"

$report = @"
# T09 Territorial Priorities - Relatorio de Verificacao
**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Objetivo

Entregar primeira camada de cobertura territorial por bairro com indice publico inicial de prioridade, recortes por condicao/verificacao e ponte clara entre `/territorio`, `/mapa` e `/transparencia`.

## DIAG

### Arquivos criados/alterados

#### Criados (T09)
$fileChecklist

#### Alterados (integracao)
$(($diagChanged | ForEach-Object { "- ``$_``" }) -join "`n")

### Estrategia escolhida para prioridade territorial

- Base em relatos `published`.
- Janela temporal por parametro (`in_days`, default 90).
- Score simples e explicito para incidencia publica:
  - `blocked * 3.0 + bad * 2.0 + verified * 1.5 + published * 1.0`
- Sem vender score como verdade absoluta.
- Sem shapefile/geometria externa neste tijolo.

### Estrategia escolhida para integrar com /mapa e /transparencia

- `/transparencia` ganhou atalho direto para `/territorio`.
- `/mapa` ganhou ponte para leitura territorial.
- `/mapa` ganhou filtros rapidos de prioridade (`apenas verificados`, `apenas bloqueios`).
- Marcadores receberam destaque visual simples para bloqueios/verificados sem introduzir camada instavel.

## VERIFY

### npm install
Exit code: $installExit
Status: $(if($installExit -eq 0){"PASS"}else{"FAIL"})

### lint
Exit code: $lintExit
Status: $(if($lintExit -eq 0){"PASS"}else{"FAIL"})


txt lint (ultimas linhas):
```
$($lintOutput -split "`n" | Select-Object -Last 12 | Out-String)
```

### typecheck
Exit code: $typecheckExit
Status: $(if($typecheckExit -eq 0){"PASS"}else{"FAIL"})


txt typecheck (ultimas linhas):
```
$($typecheckOutput -split "`n" | Select-Object -Last 12 | Out-String)
```

### build
Exit code: $buildExit
Status: $(if($buildExit -eq 0){"PASS"}else{"FAIL"})


txt build (ultimas linhas):
```
$($buildOutput -split "`n" | Select-Object -Last 30 | Out-String)
```

### Checklist de arquivos esperados

$fileChecklist

## Leitura fria do estado atual

### O que a leitura territorial ja faz de verdade

- Mostra ranking por bairro com prioridade calculada.
- Mostra recortes `blocked`, `bad`, `good`, verificados e com foto.
- Exibe alertas recentes graves/novos com link para detalhe do relato.
- Conecta de forma direta ao mapa e ao painel de transparencia.

### O que depende de env/sql/dados

- Sem env (`NEXT_PUBLIC_SUPABASE_*`), a UI degrada para estado informativo.
- Sem SQL T09 aplicado, a pagina informa RPC pendente sem quebrar build.
- Sem dados publicados, pagina mostra estado vazio sem erro.

### Riscos remanescentes

- `neighborhood` textual pode trazer inconsistencias ortograficas.
- Score ainda nao considera populacao, fluxo de pedestres ou malha oficial.
- Sem heatmap denso; apenas destaque simplificado para estabilidade.

## NEXT

- T10: filtros temporais ricos + snapshots publicos.
- ou T09b: heatmap real e camada de densidade.

## Resultado final

$(if($filesOk -and $installExit -eq 0 -and $lintExit -eq 0 -and $typecheckExit -eq 0 -and $buildExit -eq 0){"T09 VERDE"}else{"T09 COM PENDENCIAS"})
"@

Set-Content -Path $reportFile -Value $report -Encoding UTF8

Write-Host ""
Write-Host "Relatorio salvo em: $reportFile" -ForegroundColor Green

if ($filesOk -and $installExit -eq 0 -and $lintExit -eq 0 -and $typecheckExit -eq 0 -and $buildExit -eq 0) {
  Write-Host "=== T09 VERDE ===" -ForegroundColor Green
  exit 0
}

Write-Host "=== T09 COM PENDENCIAS ===" -ForegroundColor Yellow
exit 1
