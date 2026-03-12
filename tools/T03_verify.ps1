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

  if ($Lines.Count -le 70) {
    return $Lines
  }

  $head = @($Lines | Select-Object -First 40)
  $tail = @($Lines | Select-Object -Last 25)
  return @($head + "... (saida resumida) ..." + $tail)
}

Push-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
try {
  $reportPath = NewReportPath "T03-report-creation"
  $strategy = "Route handlers POST em app/api/reports/create e app/api/reports/nearby"

  $npmInstall = Invoke-Capture -CommandText "npm install"
  $lint = Invoke-Capture -CommandText "npm run lint"
  $typecheck = Invoke-Capture -CommandText "npm run typecheck"
  $build = Invoke-Capture -CommandText "npm run build"

  $expectedFiles = @(
    "lib/domain/sidewalk.ts",
    "lib/reports/create-report.ts",
    "lib/reports/find-nearby.ts",
    "app/novo/page.tsx",
    "supabase/sql/T03_reports_and_dedupe.sql",
    "docs/T03_REPORT_CREATION.md",
    "app/api/reports/create/route.ts",
    "app/api/reports/nearby/route.ts"
  )

  $fileCheckResults = @()
  foreach ($file in $expectedFiles) {
    $fileCheckResults += [PSCustomObject]@{
      File = $file
      Exists = Test-Path $file
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

  $novoStructure = @()
  if (Test-Path "app/novo") {
    $novoStructure = @(Get-ChildItem "app/novo" -Recurse | ForEach-Object { $_.FullName.Replace((Get-Location).Path + "\\", "") })
  }

  $supabaseLibStructure = @()
  if (Test-Path "lib/supabase") {
    $supabaseLibStructure = @(Get-ChildItem "lib/supabase" -Recurse | ForEach-Object { $_.FullName.Replace((Get-Location).Path + "\\", "") })
  }

  $report = @()
  $report += "# T03 - Report Creation"
  $report += ""
  $report += "## Objetivo"
  $report += "- Tornar /novo um fluxo real para criar report pending com dedupe inicial e degradacao segura."
  $report += ""
  $report += "## DIAG"
  $report += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
  $report += ("- PWD: " + (Get-Location).Path)
  $report += "- Estrategia escolhida: " + $strategy
  $report += "- Arquivos criados/alterados (git status --short):"
  if ($changed.Count -gt 0) {
    foreach ($line in ($changed | Select-Object -First 60)) {
      $report += "  - " + $line
    }
    if ($changed.Count -gt 60) {
      $report += "  - ... e " + ($changed.Count - 60) + " mais"
    }
  } else {
    $report += "  - sem alteracoes"
  }

  $report += "- Estrutura relevante app/novo:"
  if ($novoStructure.Count -gt 0) {
    foreach ($line in $novoStructure) {
      $report += "  - " + $line
    }
  } else {
    $report += "  - app/novo nao encontrado"
  }

  $report += "- Estrutura relevante lib/supabase:"
  if ($supabaseLibStructure.Count -gt 0) {
    foreach ($line in $supabaseLibStructure) {
      $report += "  - " + $line
    }
  } else {
    $report += "  - lib/supabase nao encontrado"
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
  $report += "- /novo cria report real em sidewalk_reports com status pending."
  $report += "- /novo vincula tags opcionais em sidewalk_report_tags."
  $report += "- Dedupe inicial via RPC nearby_sidewalk_reports, com fallback amigavel se RPC nao existir."
  $report += "- Sem env, sem auth ou sem SQL aplicado: UI nao quebra e mostra estado explicito."
  $report += "- Fora de escopo neste tijolo: upload de foto e mapa real." 

  $report += ""
  $report += "## NEXT"
  if ($allOk) {
    $report += "- T04: mapa + listagem published + clusters fake/real bridge"
    $report += "- Alternativa: T03b upload privado de foto se fluxo textual estiver solido"
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
