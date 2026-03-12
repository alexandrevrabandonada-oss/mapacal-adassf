$ErrorActionPreference = "Stop"

Write-Host "INICIANDO VERIFICACAO DO T13 (Alertas Automaticos)" -ForegroundColor Cyan
Write-Host "========================================="

$reportFile = "reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T13-alerts.md"
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
Set-Content -Path $reportFile -Value "# Relatorio de Verificacao T13 (Alertas Automaticos)`n"

function Append-Report($text) {
    Add-Content -Path $reportFile -Value $text
    Write-Host $text
}

function Test-Command($name, $command) {
    Write-Host "Verificando: $name..." -NoNewline
    try {
        Invoke-Expression $command | Out-Null
        Write-Host " OK" -ForegroundColor Green
        Append-Report "- [x] $name passou"
        return $true
    }
    catch {
        Write-Host " FALHOU" -ForegroundColor Red
        Append-Report "- [ ] $name FALHOU"
        Append-Report "  - Detalhe: $($_.Exception.Message)"
        return $false
    }
}

# 1. Checar existencia de arquivos chave
$filesToCheck = @(
    "supabase\sql\T13_alerts.sql",
    "lib\alerts\alert-types.ts",
    "lib\alerts\evaluate-alert-rules.ts",
    "lib\alerts\list-alert-events.ts",
    "lib\alerts\update-alert-event-status.ts",
    "lib\alerts\list-alert-runs.ts",
    "app\api\admin\alerts\evaluate\route.ts",
    "app\api\admin\alerts\status\route.ts",
    "app\alertas\page.tsx",
    "app\admin\alertas\page.tsx",
    "app\admin\alertas\client-page.tsx",
    "docs\T13_ALERTS.md"
)

Append-Report "## 1. Arquivos Chave`n"
$missingFiles = 0
foreach ($f in $filesToCheck) {
    if (Test-Path $f) {
        Append-Report "- [x] $f existe"
    }
    else {
        Append-Report "- [ ] $f AUSENTE"
        $missingFiles++
    }
}

# 2. Executar Linter
Append-Report "`n## 2. Linter (Strict)`n"
Write-Host "Rodando linter..." -ForegroundColor Yellow
$lintOk = $true
try {
    npm run lint 2>&1 | Out-Host
    Append-Report "- [x] Linter passou sem problemas."
}
catch {
    $lintOk = $false
    Append-Report "- [ ] Linter **falhou**. Revise tipagens em database.ts ou componentes."
}

# 3. Executar Build
Append-Report "`n## 3. Build (Validacao de Types e SSR)`n"
Write-Host "Rodando build..." -ForegroundColor Yellow
$buildOk = $true
try {
    npm run build 2>&1 | Out-Host
    Append-Report "- [x] Build finalizado com sucesso."
}
catch {
    $buildOk = $false
    Append-Report "- [ ] Build **falhou**. Analise a estrita de dados / SSR."
}

# 4. Avaliacao
Append-Report "`n## 4. Avaliacao Final`n"
if ($missingFiles -eq 0 -and $lintOk -and $buildOk) {
    Append-Report "✅ RESULTADO: **PASSOU**"
    Append-Report "O Modulo T13 foi implementado e está estável localmente."
    Append-Report "`n**PROXIMO PASSO:** Aplicar 'T13_alerts.sql' no Supabase para colocar de pé no backend real."
    Write-Host "`n==== T13 VERIFICADO COM SUCESSO ====" -ForegroundColor Green
}
else {
    Append-Report "❌ RESULTADO: **FALHOU**"
    Append-Report "Conserte as quebras detectadas antes de seguir."
    Write-Host "`n==== T13 TEM FALHAS ====" -ForegroundColor Red
}

Write-Host "Relatorio salvo em: $reportFile"
