$ErrorActionPreference = "Stop"

Write-Host "INICIANDO VERIFICACAO DO T12d (Auto-Diff)" -ForegroundColor Cyan
Write-Host "========================================="

$reportFile = "reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T12d-auto-diff.md"
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
Set-Content -Path $reportFile -Value "# Relatorio de Verificacao T12d (Auto-Diff)`n"

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
    "supabase\sql\T12d_auto_diffs.sql",
    "lib\snapshots\auto-diff-types.ts",
    "lib\snapshots\create-auto-diff-for-snapshot.ts",
    "lib\snapshots\find-previous-compatible-snapshot.ts",
    "lib\snapshots\list-snapshot-diff-runs.ts",
    "app\api\admin\snapshots\auto-diff\route.ts",
    "app\api\admin\snapshots\diff-runs\route.ts",
    "app\admin\snapshots\page.tsx",
    "app\admin\snapshot-jobs\page.tsx",
    "tools\T12d_run_auto_diff.ps1"
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
    npm run lint | Out-Host
    Append-Report "- [x] Linter passou sem problemas."
}
catch {
    $lintOk = $false
    Append-Report "- [ ] Linter **falhou**. Revise variaveis nao usadas ou tipagem."
}

# 3. Executar Build (sem dependencias SQL ativas via mock ou isolamento do next)
Append-Report "`n## 3. Build (Validacao de Types e SSR)`n"
Write-Host "Rodando build..." -ForegroundColor Yellow
$buildOk = $true
try {
    npm run build | Out-Host
    Append-Report "- [x] Build finalizado com sucesso."
}
catch {
    $buildOk = $false
    Append-Report "- [ ] Build **falhou**. Analise linter de producao e tipagem de database.ts."
}

# 4. Avaliacao
Append-Report "`n## 4. Avaliacao Final`n"
if ($missingFiles -eq 0 -and $lintOk -and $buildOk) {
    Append-Report "✅ RESULTADO: **PASSOU**"
    Append-Report "O Modulo T12d foi implementado corretamente, compila e passa nas validacoes estaticas. Pronto para commit e aplicacao de SQL."
    Write-Host "`n==== T12d VERIFICADO COM SUCESSO ====" -ForegroundColor Green
}
else {
    Append-Report "❌ RESULTADO: **FALHOU**"
    Append-Report "Corrija os erros apontados no linter/build ou crie os arquivos faltantes antes de prosseguir."
    Write-Host "`n==== T12d TEM FALHAS ====" -ForegroundColor Red
}

Write-Host "Relatorio gerado em: $reportFile"
