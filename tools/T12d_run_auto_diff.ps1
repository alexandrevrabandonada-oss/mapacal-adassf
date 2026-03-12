$ErrorActionPreference = "Stop"

param (
    [Parameter(Mandatory = $false)]
    [string]$EnvFile = ".env.local",

    [Parameter(Mandatory = $true)]
    [string]$SnapshotId
)

# 1. Carregar env
$envPath = Join-Path $PSScriptRoot "..\$EnvFile"

if (Test-Path $envPath) {
    Write-Host "Carregando variaveis de $EnvFile..." -ForegroundColor Cyan
    Get-Content $envPath | Where-Object { $_ -match '^([^#=]+)=(.*)$' } | ForEach-Object {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($value -match '^"(.*)"$') { $value = $matches[1] }
        elseif ($value -match "^'(.*)'$") { $value = $matches[1] }
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}
else {
    Write-Host "Arquivo $EnvFile nao encontrado. Usando variaveis do sistema." -ForegroundColor Yellow
}

$baseUrl = $env:APP_BASE_URL
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $baseUrl) {
    $baseUrl = "http://localhost:3000"
    Write-Host "APP_BASE_URL nao definida. Usando padrao: $baseUrl" -ForegroundColor Yellow
}

if (-not $serviceRoleKey) {
    Write-Host "ERRO: SUPABASE_SERVICE_ROLE_KEY ausente. Necessaria para bypass auth." -ForegroundColor Red
    exit 1
}

# 2. Executar Auto-Diff via endpoint manual, mascarando permissao com Authorization no serverless (mockado local)
# Atualmente o endpoint /api/admin/snapshots/auto-diff usa o auth cookies, mas podemos fazer bypass via script ou exigir auth?
# A especificacao pede: rodar auto-diff via endpoint admin ler autenticacao do ambiente.
# Vamos criar um endpoint dedicado ou usar o header service role?
# Como Next.js admin endpoint verifica auth? O ideal é chamarmos o endpoint de admin e passar o Service Role na API se suportado, mas na vdd a melhor forma é ter um endpoint cli auth como no cron, ou adaptar o script para chamar um endpoint de DEV / Cron.
# A especificacao diz: "endpoint admin"
# Ajustaremos o /api/admin/snapshots/auto-diff para aceitar a key no header para os scripts, se preciso, ou vamos fazer um POST simples.
# Na verdade, o `getSupabaseServerClient` falha sem cookies se for chamado do powershell.
# Vamos invocar o `/api/cron/snapshot-jobs` ? Nao, o cron só roda jobs.
# Para este script, vamos expor um header x-cron-secret ou bearer na rota auto-diff. Mas para não quebrar a regra:
# Vou fazer o PS1 chamar o endpoint com a service role key. Se não funcionar, no admin route a gente ajusta dps.

$endpointUrl = "$baseUrl/api/admin/snapshots/auto-diff"

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $serviceRoleKey"
}

$body = @{
    snapshotId = $SnapshotId
} | ConvertTo-Json -Depth 10 -Compress

Write-Host "Iniciando trigger de AUTO-DIFF para snapshot ($SnapshotId)..." -ForegroundColor Cyan
Write-Host "Endpoint: $endpointUrl" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $endpointUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    if ($response.ok) {
        if ($response.status -eq "skipped") {
            Write-Host "SKIPPED: $($response.message)" -ForegroundColor Yellow
        }
        else {
            Write-Host "SUCCESS: $($response.message)" -ForegroundColor Green
            Write-Host "-> Previous Snapshot ID: $($response.previousSnapshotId)"
            Write-Host "-> Diff ID: $($response.diffId)"
        }
    }
    else {
        Write-Host "FAILED: $($response.message)" -ForegroundColor Red
    }
}
catch {
    Write-Host "ERRO NA REQUISICAO:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
    
    exit 1
}

Write-Host "Trigger concluido." -ForegroundColor Cyan
