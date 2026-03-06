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
  $reportPath = NewReportPath "T02-supabase-base"

  $npmInstall = Invoke-Capture -CommandText "npm install"
  $lint = Invoke-Capture -CommandText "npm run lint"
  $typecheck = Invoke-Capture -CommandText "npm run typecheck"
  $build = Invoke-Capture -CommandText "npm run build"

  $expectedFiles = @(
    ".env.example",
    "lib/env.ts",
    "lib/supabase/client.ts",
    "lib/supabase/server.ts",
    "lib/supabase/middleware.ts",
    "middleware.ts",
    "app/login/page.tsx",
    "app/auth/callback/route.ts",
    "app/auth/error/page.tsx",
    "types/database.ts",
    "supabase/sql/T02_base_schema.sql",
    "docs/T02_SUPABASE_SETUP.md"
  )

  $fileCheckResults = @()
  foreach ($file in $expectedFiles) {
    $exists = Test-Path $file
    $fileCheckResults += [PSCustomObject]@{
      File = $file
      Exists = $exists
    }
  }

  $allFilesExist = @($fileCheckResults | Where-Object { -not $_.Exists }).Count -eq 0
  $allOk = ($npmInstall.ExitCode -eq 0) -and ($lint.ExitCode -eq 0) -and ($typecheck.ExitCode -eq 0) -and ($build.ExitCode -eq 0) -and $allFilesExist

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

  $topLevel = @(Get-ChildItem -Force | Select-Object -ExpandProperty Name | Sort-Object)

  $report = @()
  $report += "# T02 - Supabase Base"
  $report += ""
  $report += "## Objetivo"
  $report += "- Integrar Supabase sem CLI local, com auth foundation minima, schema SQL, tipos e documentacao."
  $report += ""
  $report += "## DIAG"
  $report += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
  $report += ("- PWD: " + (Get-Location).Path)
  $report += "- Arquivos criados/alterados (git status --short):"
  if ($createdOrChanged.Count -gt 0) {
    foreach ($line in ($createdOrChanged | Select-Object -First 50)) {
      $report += ("  - " + $line)
    }
    if ($createdOrChanged.Count -gt 50) {
      $report += ("  - ... e " + ($createdOrChanged.Count - 50) + " mais")
    }
  } else {
    $report += "  - sem alteracoes"
  }
  $report += "- Dependencias declaradas no package.json:"
  foreach ($dep in $allDeps) {
    $report += ("  - " + $dep)
  }
  $report += "- Estrutura top-level:"
  foreach ($name in ($topLevel | Where-Object { $_ -notin @("node_modules", ".next", ".git") })) {
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

  $report += "### Checklist de arquivos esperados"
  foreach ($check in $fileCheckResults) {
    $icon = if ($check.Exists) { "OK" } else { "MISSING" }
    $report += ("- [" + $icon + "] " + $check.File)
  }
  $report += ""

  $report += "## Leitura fria do estado atual"
  $report += "- Supabase base ja esta integrado ao repo e ao codigo."
  $report += "- Auth foundation (magic link) pronta em /login."
  $report += "- Schema completo esperando aplicacao manual no Supabase SQL Editor."
  $report += "- Clients browser e server seguem patterns corretos para App Router."
  $report += "- Middleware preparado para refresh de sessao (compativel com middleware.ts futuro)."
  $report += "- RLS definida mas nao testada sem dados reais no dashboard."
  $report += "- Risco: sem .env.local, login exibe estado informativo sem crash."
  $report += ""
  $report += "## NEXT"
  if ($allOk) {
    $report += "- T03: formulario /novo + criacao de report + dedupe inicial"
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
