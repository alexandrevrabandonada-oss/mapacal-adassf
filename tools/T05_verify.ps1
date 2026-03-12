# T05_verify.ps1
# Verificacao automatizada: T05 Community Verification
# Rodar: pwsh tools/T05_verify.ps1

param()

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportFile = "reports/$timestamp-T05-community-verification.md"

Write-Host ""
Write-Host "=== T05 VERIFY ===" -ForegroundColor Cyan
Write-Host ""

# Checklist de arquivos esperados
$expectedFiles = @(
  "supabase\sql\T05_verifications.sql",
  "lib\reports\confirm-report.ts",
  "app\api\reports\confirm\route.ts",
  "components\reports\confirm-report-button.tsx",
  "docs\T05_COMMUNITY_VERIFICATION.md",
  "tools\T05_verify.ps1"
)

$filesOk = $true
foreach ($file in $expectedFiles) {
  if (Test-Path $file) {
    Write-Host "[OK] $file" -ForegroundColor Green
  } else {
    Write-Host "[MISSING] $file" -ForegroundColor Red
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
  Write-Host "[WARN] lint exit $lintExit" -ForegroundColor Yellow
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

# Gerar relatorio
Write-Host ""
Write-Host "Gerando relatorio: $reportFile" -ForegroundColor Cyan

# Construir checklist de arquivos
$fileChecklistLines = $expectedFiles | ForEach-Object {
  if (Test-Path $_) {
    "- OK: ``$_``"
  } else {
    "- FALTANDO: ``$_``"
  }
}
$fileChecklist = $fileChecklistLines -join "`n"

$reportContent = @"
# T05 Community Verification - Relatorio de Verificacao
**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Resumo

T05 entrega **verificacao comunitaria**: usuarios autenticados confirmam pontos publicados, prevenindo duplicatas e fortalecendo priorizacao social.

---

## Arquivos criados/modificados

### SQL
- \`supabase/sql/T05_verifications.sql\`: RPC confirm_sidewalk_report + RLS para sidewalk_verifications

### Data layer
- \`lib/reports/confirm-report.ts\`: confirmSidewalkReport() server-only com tratamento de erros

### API
- \`app/api/reports/confirm/route.ts\`: POST handler para confirmacao via /api/reports/confirm

### UI
- \`components/reports/confirm-report-button.tsx\`: client component com botao de confirmacao
- \`app/r/[id]/page.tsx\`: integra ConfirmReportButton na pagina de detalhe
- \`app/mapa/page.tsx\`: status card atualizado para "T05 ativo" + "Verificacao comunitaria: ativa"
- \`app/novo/page.tsx\`: nearby list com link "Ver detalhes e confirmar"

### Types
- \`types/database.ts\`: assinatura do RPC confirm_sidewalk_report

### Docs
- \`docs/T05_COMMUNITY_VERIFICATION.md\`: documentacao completa do fluxo

---

## Checklist de arquivos

$fileChecklist

---

## Lint

**Exit code:** $lintExit

``````
$lintOutput
``````

---

## Typecheck

**Exit code:** $tcExit

``````
$tcOutput
``````

---

## Build

**Exit code:** $buildExit

``````
$buildOutput
``````

---

## Conclusao

$( if ($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0) {
  "**STATUS: ✅ VERDE — T05 pronto para uso.**"
} else {
  "**STATUS: ⚠️ AJUSTES NECESSARIOS**"
  ""
  if (-not $filesOk) { "- Arquivos faltando" }
  if ($lintExit -ne 0) { "- Lint falhou" }
  if ($tcExit -ne 0) { "- Typecheck falhou" }
  if ($buildExit -ne 0) { "- Build falhou" }
} )

---

**Proximos passos:**

1. Aplicar \`supabase/sql/T05_verifications.sql\` no Supabase SQL Editor.
2. Garantir que ao menos 1 ponto esteja com \`status = 'published'\`.
3. Testar fluxo:
   - Acessar \`/r/{id}\` autenticado.
   - Clicar "Confirmar este ponto".
   - Verificar contagem aumentando e badge "Verificado pela comunidade" aparecendo apos >= 2 confirmacoes.
4. Testar nearby em \`/novo\`: verificar link "Ver detalhes e confirmar" para cada ponto proximo.

---

**Fim do relatorio T05.**
"@

New-Item -Path (Split-Path $reportFile -Parent) -ItemType Directory -Force | Out-Null
Set-Content -Path $reportFile -Value $reportContent -Encoding UTF8

Write-Host ""
Write-Host "Relatorio salvo: $reportFile" -ForegroundColor Green
Write-Host ""

# Retornar exit code agregado
if ($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0) {
  Write-Host "=== T05 VERIFY: VERDE ===" -ForegroundColor Green
  exit 0
} else {
  Write-Host "=== T05 VERIFY: AJUSTES NECESSARIOS ===" -ForegroundColor Yellow
  exit 1
}
