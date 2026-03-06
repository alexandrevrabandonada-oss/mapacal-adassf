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
    $text = ($lines -join "`n")
    [System.IO.File]::WriteAllText($path, $text, $enc)
  }
  function BackupFile($path) {
    if (Test-Path $path) {
      EnsureDir "tools/_patch_backup"
      $stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
      $name = (Split-Path $path -Leaf)
      Copy-Item $path ("tools/_patch_backup/" + $stamp + "-" + $name) -Force
    }
  }
  function NewReportPath($prefix) {
    EnsureDir "reports"
    $stamp = (Get-Date).ToString("yyyy-MM-dd-HHmm")
    return ("reports/" + $stamp + "-" + $prefix + ".md")
  }
}

function Invoke-CaptureCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Exe,
    [Parameter(Mandatory = $true)][string[]]$Args
  )

  $output = @(& $Exe @Args 2>&1 | ForEach-Object { $_.ToString() })
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) {
    $exitCode = 0
  }

  return [PSCustomObject]@{
    Command  = ($Exe + " " + ($Args -join " "))
    ExitCode = $exitCode
    Output   = $output
  }
}

Push-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
try {
  EnsureDir "tools/_patch_backup"

  $doctorPath = "tools/doctor.ps1"
  $statePath = "tools/T00_state.ps1"
  $targets = @($doctorPath, $statePath)

  $backupsBefore = @()
  foreach ($leaf in @("doctor.ps1", "T00_state.ps1")) {
    $backupsBefore += @(Get-ChildItem "tools/_patch_backup" -Filter ("*-" + $leaf) -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
  }

  foreach ($target in $targets) {
    BackupFile $target
  }

  $backupsAfter = @()
  foreach ($leaf in @("doctor.ps1", "T00_state.ps1")) {
    $backupsAfter += @(Get-ChildItem "tools/_patch_backup" -Filter ("*-" + $leaf) -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
  }

  $newBackups = @($backupsAfter | Where-Object { $_ -notin $backupsBefore } | Sort-Object)

  $doctorLines = @(
    '. "$PSScriptRoot/_bootstrap.ps1"',
    '$lines = @()',
    '$lines += "# Doctor - Diagnostico do Ambiente"',
    '$lines += ""',
    '$lines += "## Sistema"',
    '$lines += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))',
    '$lines += ("- OS: " + [System.Environment]::OSVersion.VersionString)',
    '$lines += ""',
    '$lines += "## Ferramentas"',
    'function V($cmd) { try { (& $cmd --version 2>$null) } catch { "" } }',
    '$git = (Get-Command git -ErrorAction SilentlyContinue)',
    '$node = (Get-Command node -ErrorAction SilentlyContinue)',
    '$npm = (Get-Command npm -ErrorAction SilentlyContinue)',
    '$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue)',
    '$vercel = (Get-Command vercel -ErrorAction SilentlyContinue)',
    '$supabase = (Get-Command supabase -ErrorAction SilentlyContinue)',
    '$lines += ("- git: " + $(if ($git) { V git } else { "N/A" }))',
    '$lines += ("- node: " + $(if ($node) { V node } else { "N/A" }))',
    '$lines += ("- npm: " + $(if ($npm) { V npm } else { "N/A" }))',
    '$lines += ("- pnpm: " + $(if ($pnpm) { V pnpm } else { "N/A" }))',
    '$lines += ("- vercel: " + $(if ($vercel) { V vercel } else { "N/A" }))',
    '$lines += ("- supabase: " + $(if ($supabase) { V supabase } else { "N/A" }))',
    '$lines += ""',
    '$lines += "## Repo"',
    'if (Test-Path ".git") {',
    '  $lines += "- git repo: OK"',
    '  $hasInitialCommit = $false',
    '  try {',
    '    & git rev-parse --verify HEAD *> $null',
    '    $hasInitialCommit = ($LASTEXITCODE -eq 0)',
    '  } catch {',
    '    $hasInitialCommit = $false',
    '  }',
    '  if ($hasInitialCommit) {',
    '    try { $lines += ("- branch: " + (git rev-parse --abbrev-ref HEAD)) } catch { $lines += "- branch: (indisponivel)" }',
    '  } else {',
    '    $lines += "- branch: (sem commit inicial)"',
    '  }',
    '  try { $lines += ("- status: " + ((git status --porcelain).Count) + " changes") } catch {}',
    '} else {',
    '  $lines += "- git repo: NO (.git ausente)"',
    '}',
    '$lines -join "`n"'
  )

  $stateLines = @(
    '. "$PSScriptRoot/_bootstrap.ps1"',
    '$reportPath = NewReportPath "T00-state"',
    '$out = @()',
    '$out += "# Estado da Nacao - T00 (Bootstrap)"',
    '$out += ""',
    '$out += "## Objetivo"',
    '$out += "- Criar docs + ferramentas + pipeline de relatorio"',
    '$out += ""',
    '$out += "## Doctor"',
    '$out += ""',
    '$out += (& "$PSScriptRoot/doctor.ps1")',
    '$out += ""',
    '$out += "## Estrutura (top-level)"',
    '$out += ""',
    'Get-ChildItem -Force | Select-Object Name, Mode | ForEach-Object { $out += ("- " + $_.Mode + " " + $_.Name) }',
    '$out += ""',
    '$out += "## Docs gerados"',
    '$out += ""',
    '$docs = @("docs/BRIEFING.md", "docs/ROADMAP_TIJOLOS.md")',
    'foreach ($d in $docs) {',
    '  $out += ("- " + $d + ": " + $(if (Test-Path $d) { "OK" } else { "MISSING" }))',
    '}',
    '$out += ""',
    '$out += "## Proximo tijolo sugerido"',
    '$out += "- T01: Scaffold Next PWA + rotas base + verify"',
    'WriteUtf8NoBom $reportPath $out',
    'Write-Host ("Relatorio gerado: " + $reportPath)'
  )

  WriteUtf8NoBom $doctorPath $doctorLines
  WriteUtf8NoBom $statePath $stateLines

  $cmdDoctor = Invoke-CaptureCommand -Exe "pwsh" -Args @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "tools/doctor.ps1")
  $cmdState = Invoke-CaptureCommand -Exe "pwsh" -Args @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "tools/T00_state.ps1")

  $latestT00State = @(Get-ChildItem "reports" -Filter "*-T00-state.md" -File -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -Last 1)
  $t00StateGenerated = $false
  $t00StateReportPath = ""
  if ($latestT00State.Count -gt 0) {
    $t00StateGenerated = $true
    $t00StateReportPath = $latestT00State[0].FullName.Replace((Get-Location).Path + "\\", "")
  }

  $reportPath = NewReportPath "T00c-fix-state-and-git"
  $report = @()
  $report += "# T00c - Fix state and git"
  $report += ""
  $report += "## DIAG"
  $report += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
  $report += ("- PWD: " + (Get-Location).Path)
  $report += "- Arquivos-alvo encontrados:"
  foreach ($target in $targets) {
    $report += ("  - " + $target + ": " + $(if (Test-Path $target) { "OK" } else { "MISSING" }))
  }
  $report += ""
  $report += "## PATCH"
  $report += "- Arquivos alterados:"
  $report += "  - tools/doctor.ps1"
  $report += "  - tools/T00_state.ps1"
  $report += "- Backups criados:"
  if ($newBackups.Count -gt 0) {
    foreach ($b in $newBackups) {
      $report += ("  - " + $b.Replace((Get-Location).Path + "\\", ""))
    }
  } else {
    $report += "  - nenhum backup novo identificado"
  }
  $report += ""
  $report += "## VERIFY"
  $report += ("### " + '`' + $cmdDoctor.Command + '`' + " (exit " + $cmdDoctor.ExitCode + ")")
  $report += '```text'
  if ($cmdDoctor.Output.Count -gt 0) {
    $report += $cmdDoctor.Output
  } else {
    $report += "<sem saida>"
  }
  $report += '```'
  $report += ""
  $report += ("### " + '`' + $cmdState.Command + '`' + " (exit " + $cmdState.ExitCode + ")")
  $report += '```text'
  if ($cmdState.Output.Count -gt 0) {
    $report += $cmdState.Output
  } else {
    $report += "<sem saida>"
  }
  $report += '```'
  $report += ""
  $report += ("- Relatorio T00-state gerado: " + $(if ($t00StateGenerated) { "OK (" + $t00StateReportPath + ")" } else { "FALHOU" }))
  $report += ""
  $report += "## NEXT"

  if (($cmdDoctor.ExitCode -eq 0) -and ($cmdState.ExitCode -eq 0) -and $t00StateGenerated) {
    $report += "- T01 Scaffold Next PWA"
  } else {
    $report += "- Falha na verificacao."
    if ($cmdDoctor.ExitCode -ne 0) {
      $report += "- Ponto exato: tools/doctor.ps1 retornou exit code diferente de 0."
    }
    if ($cmdState.ExitCode -ne 0) {
      $report += "- Ponto exato: tools/T00_state.ps1 retornou exit code diferente de 0."
    }
    if (-not $t00StateGenerated) {
      $report += "- Ponto exato: relatorio *-T00-state.md nao foi encontrado em reports/."
    }
  }

  WriteUtf8NoBom $reportPath $report
  Write-Host ("Relatorio gerado: " + $reportPath)

  if (($cmdDoctor.ExitCode -ne 0) -or ($cmdState.ExitCode -ne 0) -or (-not $t00StateGenerated)) {
    exit 1
  }
}
finally {
  Pop-Location
}
