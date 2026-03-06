param()
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
function EnsureDir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null } }
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