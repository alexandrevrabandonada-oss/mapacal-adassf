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

  if ($Lines.Count -le 60) {
    return $Lines
  }

  $head = @($Lines | Select-Object -First 35)
  $tail = @($Lines | Select-Object -Last 20)
  return @($head + "... (saida resumida) ..." + $tail)
}

Push-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
try {
  $reportPath = NewReportPath "T01-scaffold-next"

  $createdOrChanged = @()
  try {
    $createdOrChanged = @(git status --short)
  } catch {
    $createdOrChanged = @("git status indisponivel")
  }

  $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
  $deps = @($packageJson.dependencies.PSObject.Properties | ForEach-Object { $_.Name + "@" + $_.Value })
  $devDeps = @($packageJson.devDependencies.PSObject.Properties | ForEach-Object { $_.Name + "@" + $_.Value })
  $allDeps = @($deps + $devDeps | Sort-Object)

  $npmInstall = Invoke-Capture -CommandText "npm install"
  $lint = Invoke-Capture -CommandText "npm run lint"
  $typecheck = Invoke-Capture -CommandText "npm run typecheck"
  $build = Invoke-Capture -CommandText "npm run build"

  $topLevel = @(Get-ChildItem -Force | Select-Object -ExpandProperty Name | Sort-Object)

  $allOk = ($npmInstall.ExitCode -eq 0) -and ($lint.ExitCode -eq 0) -and ($typecheck.ExitCode -eq 0) -and ($build.ExitCode -eq 0)

  $report = @()
  $report += "# T01 - Scaffold Next"
  $report += ""
  $report += "## Objetivo"
  $report += "- Criar scaffold executavel de Next.js App Router com TypeScript, Tailwind e rotas base, preservando docs/tools/reports."
  $report += ""
  $report += "## DIAG"
  $report += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
  $report += ("- PWD: " + (Get-Location).Path)
  $report += "- Arquivos criados/alterados (git status --short):"
  if ($createdOrChanged.Count -gt 0) {
    foreach ($line in $createdOrChanged) {
      $report += ("  - " + $line)
    }
  } else {
    $report += "  - sem alteracoes"
  }
  $report += "- Dependencias declaradas no package.json:"
  foreach ($dep in $allDeps) {
    $report += ("  - " + $dep)
  }
  $report += "- Estrutura top-level resultante:"
  foreach ($name in $topLevel) {
    $report += ("  - " + $name)
  }
  $report += ""
  $report += "## VERIFY"

  $steps = @($npmInstall, $lint, $typecheck, $build)
  foreach ($step in $steps) {
    $report += ("### " + '`' + $step.Command + '`' + " (exit " + $step.ExitCode + ")")
    $report += '```text'
    $report += Summarize-Output -Lines $step.Output
    $report += '```'
    $report += ""
  }

  $report += "## Leitura fria do estado atual"
  $report += "- O que ja existe: App Router com layout global, identidade visual inicial, shell compartilhado e rotas base do produto."
  $report += "- O que ainda e placeholder: mapa real, formulario conectado, painel de moderacao com auth, metricas reais de transparencia."
  $report += "- Riscos e proximos passos: sem backend integrado neste tijolo; priorizar T02 para auth, schema e RLS antes de habilitar fluxo de dados."
  $report += ""
  $report += "## NEXT"
  if ($allOk) {
    $report += "- T02: Supabase base (auth + schema + RLS)"
  } else {
    $report += "- Corrigir falhas de verify antes de seguir para T02."
    if ($npmInstall.ExitCode -ne 0) { $report += "- Falha em npm install." }
    if ($lint.ExitCode -ne 0) { $report += "- Falha em npm run lint." }
    if ($typecheck.ExitCode -ne 0) { $report += "- Falha em npm run typecheck." }
    if ($build.ExitCode -ne 0) { $report += "- Falha em npm run build." }
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
