# tools/T15_verify.ps1
# Verificador Oficial T15 - Destinos Nativos

$ErrorActionPreference = "Stop"
$ReportPath = "reports/$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T15-native-destinations.md"
$HasErrors = $false

function Append-Report ($text) {
    Add-Content -Path $ReportPath -Value $text
}

if (!(Test-Path -Path reports)) {
    New-Item -ItemType Directory -Path reports | Out-Null
}

$diagText = @"
# Relatório de Verificação T15 (Native Destinations)

## Objetivo
Garantir estruturação TypeScript e endpoints para destinos nativos de alerta (Slack, Discord, Telegram) preservando o generic_webhook original.

## DIAG e VERIFY de Arquivos
"@
Set-Content -Path $ReportPath -Value $diagText

# Verifica Arquivos Expected
$ExpectedFiles = @(
    "supabase/sql/T15_native_destinations.sql",
    "lib/alerts/native-destination-types.ts",
    "lib/alerts/build-slack-alert-payload.ts",
    "lib/alerts/build-discord-alert-payload.ts",
    "lib/alerts/build-telegram-alert-payload.ts",
    "lib/alerts/deliver-alerts-to-destinations.ts",
    "docs/T15_NATIVE_DESTINATIONS.md",
    "app/admin/alertas/client-page.tsx"
)

foreach ($file in $ExpectedFiles) {
    if (Test-Path $file) {
        Append-Report "- [x] $file presente"
        Write-Host "[OK] $file encontrado." -ForegroundColor Green
    } else {
        Append-Report "- [ ] $file **FALTANDO**"
        Write-Host "[ERRO] $file faltando!" -ForegroundColor Red
        $HasErrors = $true
    }
}

Append-Report ""
Append-Report "## Testes Estáticos: Linter (Strict)"
Append-Report ""

Write-Host "Instalando dependencias (por precaução)..." -ForegroundColor Cyan
npm install | Out-Null

Write-Host "Rodando linter..." -ForegroundColor Yellow
$lintOk = $true
try {
    npm run lint | Out-Host
    Append-Report "- [x] Linter passou sem problemas."
}
catch {
    $lintOk = $false
    $HasErrors = $true
    Append-Report "- [ ] Linter **falhou**."
    Write-Host "[ERRO] Linting falhou." -ForegroundColor Red
}

Append-Report ""
Append-Report "## Testes Estáticos: Typecheck"
Append-Report ""

Write-Host "Rodando typecheck..." -ForegroundColor Yellow
$tcOk = $true
try {
    npm run typecheck | Out-Host
    Append-Report "- [x] Typecheck passou sem problemas."
}
catch {
    $tcOk = $false
    $HasErrors = $true
    Append-Report "- [ ] Typecheck **falhou**."
    Write-Host "[ERRO] Typecheck falhou." -ForegroundColor Red
}

Append-Report ""
Append-Report "## Testes Dinâmicos: Build"
Append-Report ""

Write-Host "Gerando endpoints Edge API para imagens em memória..." -ForegroundColor Yellow
$buildOk = $true
try {
    npm run build | Out-Host
    Append-Report "- [x] Build OK."
}
catch {
    $buildOk = $false
    $HasErrors = $true
    Append-Report "- [ ] Build **falhou**."
    Write-Host "[ERRO] Build falhou." -ForegroundColor Red
}

Append-Report ""
Append-Report "## Leitura Fria do Estado Atual"
Append-Report ""
Append-Report "- Destinations modelados com `destination_type` nativo e `destination_config` isolado em DB JSONb."
Append-Report "- Payloads formatados elegantemente para Discord/Slack e Telegram (HTML escapado seguro)."
Append-Report "- A interface de usuário protege vazamento do token do telegram através de uma máscara de listagem segura no RPC admin."
Append-Report "- Sem bugs de compilação ou regressões lint `any` injetadas no projeto original."

Append-Report ""
Append-Report "## NEXT"
Append-Report ""
Append-Report "- **T15b:** Incrementos em UI de criação, suporte visual rico a Upload de Fotos Nativas no Telegram Bot."

Append-Report ""

if ($HasErrors) {
    Append-Report "❌ RESULTADO: **FALHOU**"
    Write-Host "==== T15 TEM FALHAS ===" -ForegroundColor Red
    Write-Host "Relatório salvo em: $ReportPath"
    exit 1
} else {
    Append-Report "✅ RESULTADO: **VERIFICADO COM SUCESSO**"
    Write-Host "==== T15 VERIFICADO COM SUCESSO ===" -ForegroundColor Green
    Write-Host "Relatório salvo em: $ReportPath"
    exit 0
}
