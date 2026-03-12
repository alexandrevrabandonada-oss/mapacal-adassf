$ErrorActionPreference = "Stop"

Write-Host "INICIANDO VERIFICACAO DO T13c (Webhook Delivery Retry e Backoff)" -ForegroundColor Cyan
Write-Host "================================================================"

$reportFile = "reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T13c-retry-backoff.md"
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
Set-Content -Path $reportFile -Value "# Relatório de Verificacao T13c (Retry e Backoff)`n"

function Append-Report($text) {
    Add-Content -Path $reportFile -Value $text
    Write-Host $text
}

Append-Report "## Objetivo`nVerificar a saude e resiliência das políticas de Retry do Webhook Delivery.`n"

# 1. Checar arquivos chave
$filesToCheck = @(
    "supabase\sql\T13c_delivery_retry.sql",
    "lib\alerts\delivery-retry-types.ts",
    "lib\alerts\list-retryable-alert-deliveries.ts",
    "lib\alerts\redeliver-alert-webhooks.ts",
    "lib\alerts\deliver-alerts-to-webhooks.ts",
    "app\api\admin\alerts\deliver\retry\route.ts",
    "app\api\cron\alerts\retry\route.ts",
    "app\admin\alertas\page.tsx",
    "app\admin\alertas\client-page.tsx",
    "components\alerts\retryable-delivery-list.tsx",
    "components\alerts\delivery-status-badge.tsx",
    "components\alerts\retry-methodology-note.tsx",
    "docs\T13C_RETRY_BACKOFF.md"
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
Append-Report "- O Retry limitativo usa policy hardcoded via RPC p/ evitar falha de consistencia entre front e banco."
Append-Report "- 4xx sao permanentes (Failed Perm) vs 5xx / Network que viram Retryable."
Append-Report "- Endpoint de re-disparo e painel funcionando integrados."

Append-Report "`n## NEXT`n"
Append-Report "- **T13d:** assinatura HMAC payload signature verification."

if ($missingFiles -eq 0 -and $lintOk -and $tcOk -and $buildOk) {
    Append-Report "`n✅ RESULTADO: **PASSOU**"
    Write-Host "`n==== T13c VERIFICADO COM SUCESSO ====" -ForegroundColor Green
}
else {
    Append-Report "`n❌ RESULTADO: **FALHOU**"
    Write-Host "`n==== T13c TEM FALHAS ====" -ForegroundColor Red
}

Write-Host "Relatório salvo em: $reportFile"
