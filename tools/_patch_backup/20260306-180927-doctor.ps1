. "$PSScriptRoot/_bootstrap.ps1"
$lines = @()
$lines += "# Doctor — Diagnóstico do Ambiente"
$lines += ""
$lines += "## Sistema"
$lines += ("- Data/Hora: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
$lines += ("- OS: " + [System.Environment]::OSVersion.VersionString)
$lines += ""
$lines += "## Ferramentas"
function V($cmd) { try { (& $cmd --version 2>$null) } catch { "" } }
$git = (Get-Command git -ErrorAction SilentlyContinue)
$node = (Get-Command node -ErrorAction SilentlyContinue)
$npm = (Get-Command npm -ErrorAction SilentlyContinue)
$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue)
$vercel = (Get-Command vercel -ErrorAction SilentlyContinue)
$supabase = (Get-Command supabase -ErrorAction SilentlyContinue)
$lines += ("- git: " + $(if ($git) { V git } else { "N/A" }))
$lines += ("- node: " + $(if ($node) { V node } else { "N/A" }))
$lines += ("- npm: " + $(if ($npm) { V npm } else { "N/A" }))
$lines += ("- pnpm: " + $(if ($pnpm) { V pnpm } else { "N/A" }))
$lines += ("- vercel: " + $(if ($vercel) { V vercel } else { "N/A" }))
$lines += ("- supabase: " + $(if ($supabase) { V supabase } else { "N/A" }))
$lines += ""
$lines += "## Repo"
if (Test-Path ".git") {
  $lines += "- git repo: OK"
  try { $lines += ("- branch: " + (git rev-parse --abbrev-ref HEAD)) } catch {}
  try { $lines += ("- status: " + ((git status --porcelain).Count) + " changes") } catch {}
} else {
  $lines += "- git repo: NO (.git ausente)"
}
$lines -join "`n"