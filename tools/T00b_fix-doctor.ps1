param()
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/_bootstrap.ps1"

function Invoke-CaptureCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Exe,
    [Parameter(Mandatory = $true)][string[]]$Args
  )

  $output = @(& $Exe @Args 2>&1 | ForEach-Object { $_.ToString() })
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) { $exitCode = 0 }

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
  $doctorBeforeHash = if (Test-Path $doctorPath) { (Get-FileHash $doctorPath -Algorithm SHA256).Hash } else { "MISSING" }

  $backupsBefore = @()
  if (Test-Path "tools/_patch_backup") {
    $backupsBefore = @(Get-ChildItem "tools/_patch_backup" -Filter "*-doctor.ps1" -File | Select-Object -ExpandProperty FullName)
  }

  BackupFile $doctorPath

  $backupsAfter = @()
  if (Test-Path "tools/_patch_backup") {
    $backupsAfter = @(Get-ChildItem "tools/_patch_backup" -Filter "*-doctor.ps1" -File | Select-Object -ExpandProperty FullName)
  }
  $newBackup = @($backupsAfter | Where-Object { $_ -notin $backupsBefore } | Sort-Object)[-1]
  if (-not $newBackup -and $backupsAfter.Count -gt 0) {
    $newBackup = ($backupsAfter | Sort-Object)[-1]
  }

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
    '  try { $lines += ("- branch: " + (git rev-parse --abbrev-ref HEAD)) } catch {}',
    '  try { $lines += ("- status: " + ((git status --porcelain).Count) + " changes") } catch {}',
    '} else {',
    '  $lines += "- git repo: NO (.git ausente)"',
    '}',
    '$lines -join "`n"'
  )

  WriteUtf8NoBom $doctorPath $doctorLines

  $doctorAfterHash = (Get-FileHash $doctorPath -Algorithm SHA256).Hash

  $cmdDoctor = Invoke-CaptureCommand -Exe "pwsh" -Args @("tools/doctor.ps1")
  $cmdState = Invoke-CaptureCommand -Exe "pwsh" -Args @("tools/T00_state.ps1")

  $reportPath = NewReportPath "T00b-fix-doctor"

  $existingFiles = @()
  foreach ($root in @("docs", "tools", "reports")) {
    if (Test-Path $root) {
      $existingFiles += @(Get-ChildItem $root -Recurse -Force | ForEach-Object { $_.FullName.Replace((Get-Location).Path + "\\", "") })
    }
  }

  $report = @()
  $report += "# T00b - Fix doctor.ps1"
  $report += ""
  $report += "## DIAG"
  $report += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
  $report += ("- PWD: " + (Get-Location).Path)
  $report += "- Arquivos existentes (docs/, tools/, reports/):"
  if ($existingFiles.Count -gt 0) {
    foreach ($f in ($existingFiles | Sort-Object)) {
      $report += ("  - " + $f)
    }
  } else {
    $report += "  - <nenhum>"
  }
  $report += ""
  $report += "## PATCH"
  $report += ("- Backup criado: " + $(if ($newBackup) { $newBackup.Replace((Get-Location).Path + "\\", "") } else { "nao identificado" }))
  $report += "- doctor.ps1 reescrito com sintaxe valida para if embutido em concatenacao usando subexpressao `$()."
  $report += ("- SHA256 antes: " + $doctorBeforeHash)
  $report += ("- SHA256 depois: " + $doctorAfterHash)
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
  $report += "## NEXT"
  $report += "- T01: Scaffold Next PWA + rotas base + verify"

  WriteUtf8NoBom $reportPath $report
  Write-Host ("Relatorio gerado: " + $reportPath)

  if (($cmdDoctor.ExitCode -ne 0) -or ($cmdState.ExitCode -ne 0)) {
    exit 1
  }
}
finally {
  Pop-Location
}
