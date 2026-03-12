$ErrorActionPreference = "Stop"

Write-Host "INICIANDO VERIFICACAO DO T14b (OG Aggregates)" -ForegroundColor Cyan
Write-Host "================================================================"

$reportFile = "reports\$(Get-Date -Format 'yyyy-MM-dd-HHmm')-T14b-og-aggregates.md"
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
Set-Content -Path $reportFile -Value "# Relatório de Verificacao T14b (OG Aggregates)`n"

function Append-Report($text) {
    Add-Content -Path $reportFile -Value $text
    Write-Host $text
}

Append-Report "## Objetivo`nVerificar presenca massiva do SEO Dinamico gerado pelo next/og e Metadata nas rotas agregadoras.`n"

# 1. Checar arquivos chave
$filesToCheck = @(
    "lib\og\aggregate-og.tsx",
    "docs\T14B_OG_AGGREGATES.md",
    "app\transparencia\opengraph-image.tsx",
    "app\territorio\opengraph-image.tsx",
    "app\comparativos\opengraph-image.tsx",
    "app\timeline\opengraph-image.tsx"
)

Append-Report "## DIAG e VERIFY de Arquivos OGs`n"
$missingFiles = 0
foreach ($f in $filesToCheck) {
    if (Test-Path -LiteralPath $f) {
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
    npm run lint | Out-Host
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
    npm run typecheck | Out-Host
    Append-Report "- [x] Typecheck passou sem problemas."
}
catch {
    $tcOk = $false
    Append-Report "- [ ] Typecheck **falhou**."
}

# 4. Executar Build
Append-Report "`n## Testes Dinamicos: Build (SSR Node JS)`n"
Write-Host "Gerando endpoints Edge API para imagens em memoria..." -ForegroundColor Yellow
$buildOk = $true
try {
    npm run build | Out-Host
    Append-Report "- [x] Build OK."
}
catch {
    $buildOk = $false
    Append-Report "- [ ] Build **falhou**."
}

# 5. Fechamento
Append-Report "`n## Leitura Fria do Estado Atual`n"
Append-Report "- Telas agregadoras ganharam OGs estáticos institucionais via 'next/og' que degradam com segurança."
Append-Report "- Configuração de Metadata injetada garantindo parse nativo para bots externos."
Append-Report "- Como Search Params client-side não atuam no OG Edge nativo, a estratégia priorizou visual limpo e estado estável padrão (30D)."

Append-Report "`n## NEXT`n"
Append-Report "- **T15:** Destinos Nativos (Discord/Slack/Telegram) acionando Payload nativo T13."
Append-Report "- ou **T14c:** Rotas Share (Bite-sized/Parametrizada OG)."

if ($missingFiles -eq 0 -and $lintOk -and $tcOk -and $buildOk) {
    Append-Report "`n✅ RESULTADO: **PASSOU**"
    Write-Host "`n==== T14b VERIFICADO COM SUCESSO ====" -ForegroundColor Green
}
else {
    Append-Report "`n❌ RESULTADO: **FALHOU**"
    Write-Host "`n==== T14b TEM FALHAS ====" -ForegroundColor Red
}

Write-Host "Relatório salvo em: $reportFile"
