# T06_verify.ps1
# Verificacao automatizada: T06 Moderation
# Rodar: pwsh tools/T06_verify.ps1

param()

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportFile = "reports/$timestamp-T06-moderation.md"

Write-Host ""
Write-Host "=== T06 VERIFY ===" -ForegroundColor Cyan
Write-Host ""

# Checklist de arquivos esperados
$expectedFiles = @(
  "supabase\sql\T06_moderation.sql",
  "lib\auth\get-current-profile.ts",
  "lib\reports\list-for-moderation.ts",
  "lib\reports\moderate-report.ts",
  "app\api\reports\moderation-list\route.ts",
  "app\api\reports\moderate\route.ts",
  "app\admin\moderacao\page.tsx",
  "docs\T06_MODERATION.md",
  "tools\T06_verify.ps1"
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
    "OK: ``$_``"
  } else {
    "FALTANDO: ``$_``"
  }
}
$fileChecklist = $fileChecklistLines -join "`n"

$reportContent = @"
# T06 Moderation - Relatorio de Verificacao
**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Resumo

T06 entrega **moderacao operacional**: painel /admin/moderacao funcional com autenticacao, autorizacao por role (moderator/admin), listagem de reports por status, acoes de publicar/ocultar/pedir revisao, e registro em moderation_events.

---

## Arquivos criados/modificados

### SQL
- ``supabase/sql/T06_moderation.sql``: helper is_moderator() + RPCs list_reports_for_moderation e moderate_sidewalk_report + indices

### Data layers
- ``lib/auth/get-current-profile.ts``: getCurrentProfile() server-only com role/canModerate
- ``lib/reports/list-for-moderation.ts``: listReportsForModeration() chamando RPC para moderadores
- ``lib/reports/moderate-report.ts``: moderateSidewalkReport() para publish/hide/request_review

### API
- ``app/api/reports/moderation-list/route.ts``: GET handler para listar reports moderaveis
- ``app/api/reports/moderate/route.ts``: POST handler para acoes de moderacao

### UI
- ``app/admin/moderacao/page.tsx``: reescrita completa com client component, estados auth/permission, filtros, lista de cards, acoes operacionais
- ``app/page.tsx``: status card atualizado para "T06 ativo" + "Moderacao operacional: ativa"

### Types
- ``types/database.ts``: assinaturas dos RPCs list_reports_for_moderation e moderate_sidewalk_report

### Docs
- ``docs/T06_MODERATION.md``: documentacao completa do fluxo operacional

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
  "**STATUS: ✅ VERDE — T06 pronto para uso.**"
} else {
  "**STATUS: ⚠️ AJUSTES NECESSARIOS**"
  ""
  if (-not $filesOk) { "Arquivos faltando" }
  if ($lintExit -ne 0) { "Lint falhou" }
  if ($tcExit -ne 0) { "Typecheck falhou" }
  if ($buildExit -ne 0) { "Build falhou" }
} )

---

**Proximos passos:**

1. Aplicar ``supabase/sql/T06_moderation.sql`` no Supabase SQL Editor.
2. Promover ao menos 1 usuario a role moderator ou admin via Table Editor (public.profiles).
3. Criar report via /novo (status = pending).
4. Fazer login com conta moderator/admin.
5. Acessar /admin/moderacao.
6. Publicar o report.
7. Verificar em /mapa que o ponto apareceu.

---

**Fim do relatorio T06.**
"@

New-Item -Path (Split-Path $reportFile -Parent) -ItemType Directory -Force | Out-Null
Set-Content -Path $reportFile -Value $reportContent -Encoding UTF8

Write-Host ""
Write-Host "Relatorio salvo: $reportFile" -ForegroundColor Green
Write-Host ""

# Retornar exit code agregado
if ($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0) {
  Write-Host "=== T06 VERIFY: VERDE ===" -ForegroundColor Green
  exit 0
} else {
  Write-Host "=== T06 VERIFY: AJUSTES NECESSARIOS ===" -ForegroundColor Yellow
  exit 1
}
