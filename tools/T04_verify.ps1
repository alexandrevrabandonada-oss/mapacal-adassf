param()
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$bootstrapPath = Join-Path $PSScriptRoot "_bootstrap.ps1"
if (Test-Path $bootstrapPath) {
  . $bootstrapPath
} else {
  function EnsureDir($p) {
    if (-not (Test-Path $p)) {
      New-Item -ItemType Directory -Path $p | Out-Null
    }
  }
  function WriteUtf8NoBom($path, [string[]]$lines) {
    $enc = New-Object System.Text.UTF8Encoding($false)
    EnsureDir (Split-Path $path -Parent)
    [System.IO.File]::WriteAllText($path, ($lines -join "`n"), $enc)
  }
  function NewReportPath($prefix) {
    EnsureDir "reports"
    $stamp = (Get-Date).ToString("yyyy-MM-dd-HHmm")
    return ("reports/" + $stamp + "-" + $prefix + ".md")
  }
}

function Invoke-Capture {
  param([Parameter(Mandatory = $true)][string]$CommandText)

  $output = @(& cmd /c $CommandText 2>&1 | ForEach-Object { $_.ToString() })
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) {
    $exitCode = 0
  }

  [PSCustomObject]@{
    Command = $CommandText
    ExitCode = $exitCode
    Output = $output
  }
}

function Summarize-Output {
  param([string[]]$Lines)

  if (-not $Lines -or $Lines.Count -eq 0) {
    return @("<sem saida>")
  }

  if ($Lines.Count -le 80) {
    return $Lines
  }

  $head = @($Lines | Select-Object -First 45)
  $tail = @($Lines | Select-Object -Last 25)
  return @($head + "... (saida resumida) ..." + $tail)
}

Push-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
try {
  $reportPath = NewReportPath "T04-public-map"
  $mapStrategy = "MapLibre em componente client com dynamic import e ssr:false"
  $dataStrategy = "RPCs publicas list_published_reports e get_published_report_by_id"

  $npmInstall = Invoke-Capture -CommandText "npm install"
  $lint = Invoke-Capture -CommandText "npm run lint"
  $typecheck = Invoke-Capture -CommandText "npm run typecheck"
  $build = Invoke-Capture -CommandText "npm run build"

  $expectedFiles = @(
    "lib/reports/list-published.ts",
    "lib/reports/list-published-types.ts",
    "components/map/report-map.tsx",
    "components/map/report-map-client.tsx",
    "components/map/report-list.tsx",
    "components/map/report-filters.tsx",
    "components/map/report-detail-card.tsx",
    "app/mapa/page.tsx",
    "app/r/[id]/page.tsx",
    "supabase/sql/T04_public_map.sql",
    "docs/T04_PUBLIC_MAP.md"
  )

  $fileCheckResults = @()
  foreach ($file in $expectedFiles) {
    $fileCheckResults += [PSCustomObject]@{
      File = $file
      Exists = Test-Path -LiteralPath $file
    }
  }

  $allFilesExist = @($fileCheckResults | Where-Object { -not $_.Exists }).Count -eq 0
  $allOk = ($npmInstall.ExitCode -eq 0) -and ($lint.ExitCode -eq 0) -and ($typecheck.ExitCode -eq 0) -and ($build.ExitCode -eq 0) -and $allFilesExist

  $changed = @()
  try {
    $changed = @(git status --short)
  } catch {
    $changed = @("git status indisponivel")
  }

  $report = @()
  $report += "# T04 - Public Map"
  $report += ""
  $report += "## Objetivo"
  $report += "- Entregar /mapa publico funcional com leitura de registros published, filtros e lista sincronizada."
  $report += ""
  $report += "## DIAG"
  $report += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
  $report += ("- PWD: " + (Get-Location).Path)
  $report += "- Estrategia tecnica maplibre no Next: " + $mapStrategy
  $report += "- Estrategia de dados publicos: " + $dataStrategy
  $report += "- Arquivos criados/alterados (git status --short):"
  if ($changed.Count -gt 0) {
    foreach ($line in ($changed | Select-Object -First 80)) {
      $report += "  - " + $line
    }
    if ($changed.Count -gt 80) {
      $report += "  - ... e " + ($changed.Count - 80) + " mais"
    }
  } else {
    $report += "  - sem alteracoes"
  }

  $report += ""
  $report += "## VERIFY"
  foreach ($step in @($lint, $typecheck, $build)) {
    $report += "### " + '`' + $step.Command + '`' + " (exit " + $step.ExitCode + ")"
    $report += '```text'
    $report += Summarize-Output -Lines $step.Output
    $report += '```'
    $report += ""
  }

  $report += "### Checklist de arquivos esperados"
  foreach ($check in $fileCheckResults) {
    $icon = if ($check.Exists) { "OK" } else { "MISSING" }
    $report += "- [" + $icon + "] " + $check.File
  }

  $report += ""
  $report += "## Leitura fria do estado atual"
  $report += "- /mapa mostra pontos publicados em mapa com marcadores e filtros basicos."
  $report += "- /mapa depende de env e SQL T04 aplicados para leitura real do Supabase."
  $report += "- /r/[id] agora mostra detalhe publico real para item publicado."
  $report += "- Risco remanescente: sem clusterizacao/heatmap e sem fluxo de confirmacao comunitaria." 

  $report += ""
  $report += "## NEXT"
  if ($allOk) {
    $report += "- T05: detalhe publico completo + confirmar existente + verificacao comunitaria"
    $report += "- Ou T04b: clusters / heatmap / cobertura por bairro"
  } else {
    $report += "- Falhas detectadas:"
    if ($npmInstall.ExitCode -ne 0) { $report += "  - npm install falhou" }
    if ($lint.ExitCode -ne 0) { $report += "  - npm run lint falhou" }
    if ($typecheck.ExitCode -ne 0) { $report += "  - npm run typecheck falhou" }
    if ($build.ExitCode -ne 0) { $report += "  - npm run build falhou" }
    if (-not $allFilesExist) {
      $missing = @($fileCheckResults | Where-Object { -not $_.Exists } | ForEach-Object { $_.File })
      $report += "  - Arquivos faltando: " + ($missing -join ", ")
    }
  }

  WriteUtf8NoBom $reportPath $report
  Write-Host ("Relatorio gerado: " + $reportPath)

  if (-not $allOk) {
    exit 1
  }
}
finally {
  Pop-Location
}
