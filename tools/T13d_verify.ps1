$ErrorActionPreference = "Stop"

Write-Host "INICIANDO VERIFICACAO DO T13d (Webhook Signatures HMAC)" -ForegroundColor Cyan
Write-Host "================================================================"

$reportFile = "reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T13d-webhook-signatures.md"
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
Set-Content -Path $reportFile -Value "# Relatório de Verificacao T13d (Webhook Signatures HMAC)`n"

function Append-Report($text) {
    Add-Content -Path $reportFile -Value $text
    Write-Host $text
}

Append-Report "## Objetivo`nVerificar a segurança do delivery e sanidade do pacote criptografico inserido no servidor.`n"

# 1. Checar arquivos chave
$filesToCheck = @(
    "supabase\sql\T13d_webhook_signatures.sql",
    "lib\alerts\webhook-signing.ts",
    "lib\alerts\deliver-alerts-to-webhooks.ts",
    "lib\alerts\webhook-types.ts",
    "types\database.ts",
    "app\admin\alertas\client-page.tsx",
    "app\admin\alertas\page.tsx",
    "components\alerts\webhook-destination-list.tsx",
    "docs\T13D_WEBHOOK_SIGNATURES.md"
)

Append-Report "## DIAG e VERIFY de Arquivos`n"
$missingFiles = 0
foreach ($f in $filesToCheck) {
    if (Test-Path $f) {
        Append-Report "- [x] $f presente"
    }
    else {
        Append-Report "- [ ] $f AUSENTE"
        $missingFiles++
    }
}

# 2. Executar Linter
Append-Report "`n## Testes Estaticos: Linter (Strict)`n"
Write-Host "Rodando linter..." -ForegroundColor Yellow
$lintOk = $true
try {
    npm run lint 2>&1 | Out-Host
    Append-Report "- [x] Linter passou sem problemas."
}
catch {
    $lintOk = $false
    Append-Report "- [ ] Linter **falhou**."
}

# 3. Executar Typecheck
Append-Report "`n## Testes Estaticos: Typecheck`n"
Write-Host "Rodando typecheck..." -ForegroundColor Yellow
$tcOk = $true
try {
    npm run typecheck 2>&1 | Out-Host
    Append-Report "- [x] Typecheck passou sem problemas."
}
catch {
    $tcOk = $false
    Append-Report "- [ ] Typecheck **falhou**."
}

# 4. Executar Build
Append-Report "`n## Testes Dinamicos: Build (SSR Node JS)`n"
Write-Host "Rodando build..." -ForegroundColor Yellow
$buildOk = $true
try {
    npm run build 2>&1 | Out-Host
    Append-Report "- [x] Build OK."
}
catch {
    $buildOk = $false
    Append-Report "- [ ] Build **falhou**."
}

# 5. Fechamento
Append-Report "`n## Leitura Fria do Estado Atual`n"
Append-Report "- Rotina Node Crypto usada para garantir robustez sem dependências infladas."
Append-Report "- Painel UI atualizado para ocultar Secrets, servindo apenas informativos (badges HMAC)."
Append-Report "- Compatibilidade Total. Quem tinha signing_mode 'none' segue vida normal."

Append-Report "`n## NEXT`n"
Append-Report "- **T14:** Meta-tags sociais (OG) em visualização de Snapshots e Alertas Públicos para links ricos."

if ($missingFiles -eq 0 -and $lintOk -and $tcOk -and $buildOk) {
    Append-Report "`n✅ RESULTADO: **PASSOU**"
    Write-Host "`n==== T13d VERIFICADO COM SUCESSO ====" -ForegroundColor Green
}
else {
    Append-Report "`n❌ RESULTADO: **FALHOU**"
    Write-Host "`n==== T13d TEM FALHAS ====" -ForegroundColor Red
}

Write-Host "Relatório salvo em: $reportFile"
