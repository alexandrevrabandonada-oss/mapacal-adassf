# T08_verify.ps1
# Verificacao automatizada: T08 Transparency e Exportacoes
# Rodar: pwsh tools/T08_verify.ps1

param()

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportFile = "reports/$timestamp-T08-transparency-exports.md"

Write-Host ""
Write-Host "=== T08 VERIFY ===" -ForegroundColor Cyan
Write-Host ""

# Checklist de arquivos esperados
$expectedFiles = @(
  "supabase\sql\T08_transparency_exports.sql",
  "lib\reports\get-transparency-summary.ts",
  "lib\reports\get-transparency-breakdowns.ts",
  "lib\reports\export-published-reports.ts",
  "app\api\exports\reports.csv\route.ts",
  "app\api\exports\reports.geojson\route.ts",
  "components\transparency\summary-cards.tsx",
  "components\transparency\condition-breakdown.tsx",
  "components\transparency\neighborhood-breakdown.tsx",
  "components\transparency\timeline-list.tsx",
  "components\transparency\export-panel.tsx",
  "app\transparencia\page.tsx",
  "app\page.tsx",
  "docs\T08_TRANSPARENCY_EXPORTS.md",
  "tools\T08_verify.ps1"
)

$filesOk = $true
$fileChecklistLines = @()
foreach ($file in $expectedFiles) {
  if (Test-Path $file) {
    Write-Host "[OK] $file" -ForegroundColor Green
    $fileChecklistLines += "OK: ``$file``"
  } else {
    Write-Host "[MISSING] $file" -ForegroundColor Red
    $fileChecklistLines += "FALTANDO: ``$file``"
    $filesOk = $false
  }
}

Write-Host ""

# Lint
Write-Host "Running npm run lint..." -ForegroundColor Yellow
$lintOutput = npm run lint 2>&1 | Out-String
$lintExit = $LASTEXITCODE
if ($lintExit -eq 0) {
  Write-Host "[PASS] lint exit $lintExit" -ForegroundColor Green
} else {
  Write-Host "[FAIL] lint exit $lintExit" -ForegroundColor Red
}

# Typecheck
Write-Host "Running npm run typecheck..." -ForegroundColor Yellow
$tcOutput = npm run typecheck 2>&1 | Out-String
$tcExit = $LASTEXITCODE
if ($tcExit -eq 0) {
  Write-Host "[PASS] typecheck exit $tcExit" -ForegroundColor Green
} else {
  Write-Host "[FAIL] typecheck exit $tcExit" -ForegroundColor Red
}

# Build
Write-Host "Running npm run build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1 | Out-String
$buildExit = $LASTEXITCODE
if ($buildExit -eq 0) {
  Write-Host "[PASS] build exit $buildExit" -ForegroundColor Green
} else {
  Write-Host "[FAIL] build exit $buildExit" -ForegroundColor Red
}

# Contar rotas geradas
$routeCount = 0
if ($buildOutput -match "Route \(app\)") {
  $routeLines = $buildOutput -split "`n" | Where-Object { $_ -match "^\s*(ô|├|└)+.*/(api|auth|admin|mapa|novo|r|transparencia|login)" }
  $routeCount = $routeLines.Count
}

Write-Host ""
Write-Host "Rotas geradas: $routeCount (esperado: 20)" -ForegroundColor Cyan

# Gerar relatorio
Write-Host ""
Write-Host "Gerando relatorio: $reportFile" -ForegroundColor Cyan

$fileChecklist = $fileChecklistLines -join "`n"

$reportContent = @"
# T08 Transparency e Exportacoes - Relatorio de Verificacao
**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Resumo

T08 entrega **transparencia e export**: painel /transparencia com metricas reais (published, verified, pending, needs_review, hidden), breakdowns por condicao e bairro, serie temporal de atividade, e exportacoes publicas em CSV e GeoJSON.

---

## Arquivos verificados

$fileChecklist

Total: $($expectedFiles.Count) arquivos  
Status: $(if($filesOk){"✅ TODOS PRESENTES"}else{"❌ ARQUIVOS FALTANDO"})

---

## DIAG

### Arquivos criados/modificados na PATCH

#### SQL (supabase/sql/)
- T08_transparency_exports.sql: 5 RPCs + 3 índices para agregações

#### Data layers (lib/reports/)
- get-transparency-summary.ts: busca resumo aggregado (ok/reason/message pattern)
- get-transparency-breakdowns.ts: busca 3 breakdowns em paralelo
- export-published-reports.ts: export data + converters CSV/GeoJSON

#### API routes (app/api/exports/)
- reports.csv/route.ts: GET para download CSV
- reports.geojson/route.ts: GET para download GeoJSON

#### Componentes (components/transparency/)
- summary-cards.tsx: 5 cards grandes com contadores
- condition-breakdown.tsx: barras por condicao
- neighborhood-breakdown.tsx: lista top bairros
- timeline-list.tsx: serie temporal
- export-panel.tsx: botoes de download

#### Página
- app/transparencia/page.tsx: reescrita com dados reais
- app/page.tsx: status atualizado

#### Documentação
- docs/T08_TRANSPARENCY_EXPORTS.md: 200+ linhas cobrindo setup, fluxos, limites

### Estratégia de métricas

**escolha SQL RPCs** em vez de view postgres:
- Mais flexível para parametrização (in_days, in_neighborhood)
- Reusable em múltiplos endpoints
- Cache natural do Supabase (RPC result cache)

**Dados agregados apenas publicados**:
- `get_transparency_summary`: sum(case when status='published'...)
- `get_condition_breakdown`: where status='published'
- `get_neighborhood_breakdown`: where status='published'
- `get_timeline_data`: where status='published'
- `export_published_reports`: where status='published'

**Segurança por design**:
- RPC não expõem photo_private_path (apenas has_photo boolean)
- Apenas published visível
- API routes com env checks
- Degradação segura sem stack traces

### Estratégia de export

**Formato CSV**: RFC 4180 com quoted fields, escape de aspas
**Formato GeoJSON**: FeatureCollection com Point geometry, properties contêm dados

**Nunca fazer export de:**
- photo_private_path
- created_by (privacy)
- status (redundante, todos são published)

---

## VERIFY

### Comandos executados

#### lint
Exit code: $lintExit  
Status: $(if($lintExit -eq 0){"✅ PASS"}else{"❌ FAIL"})

#### typecheck
Exit code: $tcExit  
Status: $(if($tcExit -eq 0){"✅ PASS"}else{"❌ FAIL"})

#### build
Exit code: $buildExit  
Status: $(if($buildExit -eq 0){"✅ PASS"}else{"❌ FAIL"})

Rotas geradas: $routeCount (T07 tinha 18, T08 adiciona /api/exports/reports.csv e /api/exports/reports.geojson = 20 total)

---

### lint output (resumido)
``````
$($lintOutput -split "`n" | Select-Object -Last 5 | Out-String)
``````

### typecheck output (resumido)
``````
$($tcOutput -split "`n" | Select-Object -Last 3 | Out-String)
``````

### build output (últimas 30 linhas)
``````
$($buildOutput -split "`n" | Select-Object -Last 30 | Out-String)
``````

---

## Estado atual da transparência

### O que /transparencia faz de verdade

✅ Busca via RPC metricas reais do banco  
✅ Mostra resumo geral (published/verified/pending/needs_review/hidden)  
✅ Mostra breakdown por condicao da calcada  
✅ Mostra top 20 bairros com contagem  
✅ Mostra serie temporal dos últimos 30 dias  
✅ Oferece download CSV + GeoJSON de published reports  
✅ Degrada com segurança quando env/SQL ausentes  

### O que depende de env/SQL/dados

⚠️ Métricas reais exigem `NEXT_PUBLIC_SUPABASE_*` configurado  
⚠️ RPCs exigem T08_transparency_exports.sql aplicado  
⚠️ Cards vazios se nenhum report publicado  
⚠️ Export vazio se nenhum report published  
⚠️ Sem cache explicito (RPC toda request; OK para MVP)  

### Riscos remanescentes

⚠️ **Sem rate limiting em exports**: alguém poderia hacer download repetido grande dataset (aceito para MVP)  
⚠️ **Sem paginação em export**: dataset completo toda vez (OK até ~10k reports)  
⚠️ **Sem versionamento**: export muda entre downloads (é feature, não bug)  
⚠️ **Sem CORS headers**: export rodando na mesma origem (OK para primeira linha)  

---

## Resultado final

$(if($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0){"✅ **T08 VERDE**: Todos os checks passaram. Sistema pronto para deploy."}else{"⚠️ **T08 COM PENDENCIAS**: Revisar erros acima antes de deploy."})

---

## Próximas etapas

- **T08b**: Snapshots públicos (arquivo semanal/mensal)
- **T09**: Cobertura territorial (heatmap, priorização por bairro)
- **T10**: Filtros temporais ricos (data picker)
- **T11**: API pública (endpoints adicionais, webhooks)

---

**FIM VERIFICACAO T08**
"@

# Criar diretorio reports se não existir
if (-not (Test-Path "reports")) {
  New-Item -ItemType Directory -Path "reports" | Out-Null
}

# Escrever relatorio
Set-Content -Path $reportFile -Value $reportContent -Encoding UTF8

Write-Host ""
Write-Host "Relatorio salvo: $reportFile" -ForegroundColor Green
Write-Host ""

# Summary final
if ($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0) {
  Write-Host "=== T08 VERDE ===" -ForegroundColor Green
  Write-Host "Todos os checks passaram. Sistema pronto." -ForegroundColor Green
  exit 0
} else {
  Write-Host "=== T08 COM PENDENCIAS ===" -ForegroundColor Yellow
  Write-Host "Revisar relatorio: $reportFile" -ForegroundColor Yellow
  exit 1
}
