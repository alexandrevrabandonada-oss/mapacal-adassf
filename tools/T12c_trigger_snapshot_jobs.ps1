param (
    [switch]$AllEligible,
    [string]$JobId,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Carregar variáveis de ambiente locais usando Expressão Regular
$envFile = "$PSScriptRoot\..\.env.local"
if (!(Test-Path $envFile)) {
    Write-Host "Arquivo .env.local nao encontrado em $envFile" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile
foreach ($line in $envContent) {
    if ($line -match '^\s*([^#]\w+)\s*=\s*(.*)') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path env:\$name -Value $value
    }
}

$baseUrl = $env:APP_BASE_URL
$cronSecret = $env:SNAPSHOT_CRON_SECRET

if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    Write-Host "Variavel APP_BASE_URL nao configurada no .env.local" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($cronSecret)) {
    Write-Host "Variavel SNAPSHOT_CRON_SECRET nao configurada no .env.local" -ForegroundColor Red
    exit 1
}

$endpoint = "$baseUrl/api/cron/snapshot-jobs"

$bodyObj = @{}
if ($JobId) {
    $bodyObj.jobId = $JobId
}
if ($DryRun) {
    $bodyObj.dryRun = $true
}

$bodyJson = "{}"
if ($bodyObj.Count -gt 0) {
    $bodyJson = $bodyObj | ConvertTo-Json -Depth 5 -Compress
}

Write-Host "Disparando T12c Cron Endpoint: $endpoint" -ForegroundColor Cyan
Write-Host "Payload: $bodyJson" -ForegroundColor DarkGray

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers @{
        "x-cron-secret" = $cronSecret
        "Content-Type" = "application/json"
    } -Body $bodyJson

    Write-Host "`n=== RESULTADO ===" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
}
catch {
    Write-Host "`n=== ERRO ===" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
    
    # Try to extract the response payload if available
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errBody = $reader.ReadToEnd()
        Write-Host "Detalhe: $errBody" -ForegroundColor DarkGray
    } catch {
        # ignore
    }
    
    exit 1
}
