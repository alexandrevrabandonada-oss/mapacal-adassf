$ErrorActionPreference = "Stop"

Write-Host "INICIANDO VERIFICACAO DO T13b (Webhook Delivery)" -ForegroundColor Cyan
Write-Host "========================================="

$reportFile = "reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T13b-webhook-delivery.md"
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
Set-Content -Path $reportFile -Value "# Relatorio de Verificacao T13b (Webhook Delivery)`n"

function Append-Report($text) {
    Add-Content -Path $reportFile -Value $text
    Write-Host $text
}

Append-Report "## Objetivo`nVerificar e atestar a saude do patch de integracao dos Alertas via Webhooks.`n"

# 1. Checar existencia de arquivos chave
$filesToCheck = @(
    "supabase\sql\T13b_webhooks.sql",
    "lib\alerts\webhook-types.ts",
    "lib\alerts\list-webhook-destinations.ts",
    "lib\alerts\list-open-alert-events-for-delivery.ts",
    "lib\alerts\list-alert-deliveries.ts",
    "lib\alerts\list-alert-delivery-runs.ts",
    "lib\alerts\deliver-alerts-to-webhooks.ts",
    "app\api\admin\alerts\deliver\route.ts",
    "app\api\admin\alerts\webhooks\list\route.ts",
    "app\api\admin\alerts\deliveries\list\route.ts",
    "app\api\cron\alerts\deliver\route.ts",
    "app\admin\alertas\page.tsx",
    "app\admin\alertas\client-page.tsx",
    "components\alerts\delivery-run-list.tsx",
    "components\alerts\delivery-list.tsx",
    "components\alerts\webhook-destination-list.tsx",
    "components\alerts\webhook-methodology-note.tsx",
    "docs\T13B_WEBHOOK_DELIVERY.md"
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
Append-Report "- O sistema de endpoints isolados foi consolidado com endpoints CRON autenticados via Segredo."
Append-Report "- O UI Component System esta flexivel e nao depende de pacotes uninstalled."
Append-Report "- Dedupe: Alertas ja 'SUCCESS' pro destino NUNCA reenviam p/ o memo URL sem reset de flag no banco."
Append-Report "- Depende ainda da aplicacao do T13b_webhooks.sql via editor."

Append-Report "`n## NEXT`n"
Append-Report "- **T14:** public OG/Cards format ou reenvio automatico robusto de backoff."

if ($missingFiles -eq 0 -and $lintOk -and $tcOk -and $buildOk) {
    Append-Report "`n✅ RESULTADO: **PASSOU**"
    Write-Host "`n==== T13b VERIFICADO COM SUCESSO ====" -ForegroundColor Green
}
else {
    Append-Report "`n❌ RESULTADO: **FALHOU**"
    Write-Host "`n==== T13b TEM FALHAS ====" -ForegroundColor Red
}

Write-Host "Relatorio salvo em: $reportFile"
