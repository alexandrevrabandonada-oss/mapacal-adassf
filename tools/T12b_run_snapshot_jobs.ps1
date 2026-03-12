#!/usr/bin/env pwsh

param(
  [string]$JobId,
  [switch]$ListOnly
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$text)
  Write-Host "[STEP] $text"
}

function Write-Ok {
  param([string]$text)
  Write-Host "[OK] $text" -ForegroundColor Green
}

function Write-Fail {
  param([string]$text)
  Write-Host "[FAIL] $text" -ForegroundColor Red
}

$baseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if ([string]::IsNullOrWhiteSpace($baseUrl)) {
  Write-Fail "NEXT_PUBLIC_SUPABASE_URL ausente"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
  Write-Fail "SUPABASE_SERVICE_ROLE_KEY ausente"
  exit 1
}

$headers = @{
  apikey = $serviceRoleKey
  Authorization = "Bearer $serviceRoleKey"
  "Content-Type" = "application/json"
}

function Invoke-Rpc {
  param(
    [string]$RpcName,
    [object]$Payload
  )

  $uri = "$baseUrl/rest/v1/rpc/$RpcName"
  $body = if ($null -eq $Payload) { "{}" } else { ($Payload | ConvertTo-Json -Depth 10 -Compress) }

  return Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body
}

Write-Step "Listando jobs configurados"
$jobs = @(Invoke-Rpc -RpcName "list_snapshot_jobs" -Payload @{})

if ($jobs.Count -eq 0) {
  Write-Ok "Nenhum job cadastrado"
  exit 0
}

$enabledJobs = @($jobs | Where-Object { $_.is_enabled -eq $true })

Write-Host ""
Write-Host "Jobs encontrados:"
$jobs | ForEach-Object {
  $status = if ($_.is_enabled) { "ativo" } else { "inativo" }
  Write-Host "- $($_.id) | $($_.kind) | $($_.frequency) | $($_.days)d | $status"
}

if ($ListOnly) {
  Write-Ok "Listagem concluida"
  exit 0
}

$targets = @()
if (-not [string]::IsNullOrWhiteSpace($JobId)) {
  $selected = $jobs | Where-Object { $_.id -eq $JobId } | Select-Object -First 1
  if ($null -eq $selected) {
    Write-Fail "JobId nao encontrado: $JobId"
    exit 1
  }
  $targets = @($selected)
} else {
  $targets = $enabledJobs
}

if ($targets.Count -eq 0) {
  Write-Ok "Sem jobs ativos para executar"
  exit 0
}

Write-Step "Executando jobs"
$hasFailure = $false

foreach ($job in $targets) {
  Write-Host ""
  Write-Host "[RUN] $($job.id) | $($job.kind) | $($job.frequency) | $($job.days)d"

  try {
    $result = @(Invoke-Rpc -RpcName "run_snapshot_job" -Payload @{ in_job_id = $job.id }) | Select-Object -First 1

    if ($null -eq $result) {
      Write-Fail "Resposta vazia"
      $hasFailure = $true
      continue
    }

    $status = [string]$result.status
    $message = [string]$result.message
    $snapshotId = [string]$result.snapshot_id

    if ($status -eq "success") {
      Write-Ok "success | $message | snapshot=$snapshotId"
    } elseif ($status -eq "skipped") {
      Write-Host "[SKIP] $message" -ForegroundColor Yellow
    } else {
      Write-Fail "error | $message"
      $hasFailure = $true
    }
  } catch {
    Write-Fail "Falha na chamada RPC: $($_.Exception.Message)"
    $hasFailure = $true
  }
}

Write-Step "Listando historico recente"
try {
  $runs = @(Invoke-Rpc -RpcName "list_snapshot_job_runs" -Payload @{ in_limit = 20 })
  if ($runs.Count -eq 0) {
    Write-Host "- sem historico"
  } else {
    $runs | Select-Object -First 20 | ForEach-Object {
      Write-Host "- $($_.started_at) | $($_.status) | job=$($_.job_id) | snapshot=$($_.snapshot_id)"
    }
  }
} catch {
  Write-Fail "Nao foi possivel listar historico: $($_.Exception.Message)"
  $hasFailure = $true
}

if ($hasFailure) {
  exit 1
}

Write-Ok "Execucao finalizada"
exit 0
