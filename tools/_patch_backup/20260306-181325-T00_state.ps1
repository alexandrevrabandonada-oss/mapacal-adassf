. "$PSScriptRoot/_bootstrap.ps1"
$reportPath = NewReportPath "T00-state"
$out = @()
$out += "# Estado da Nação — T00 (Bootstrap)"
$out += ""
$out += "## Objetivo"
$out += "- Criar docs + ferramentas + pipeline de relatório"
$out += ""
$out += "## Doctor"
$out += ""
$out += (& "$PSScriptRoot/doctor.ps1")
$out += ""
$out += "## Estrutura (top-level)"
$out += ""
Get-ChildItem -Force | Select-Object Name, Mode | ForEach-Object { $out += ("- " + $_.Mode + " " + $_.Name) }
$out += ""
$out += "## Docs gerados"
$out += ""
$docs = @("docs/BRIEFING.md","docs/ROADMAP_TIJOLOS.md")
foreach ($d in $docs) {
  $out += ("- " + $d + ": " + $(if (Test-Path $d) { "OK" } else { "MISSING" }))
}
$out += ""
$out += "## Próximo tijolo sugerido"
$out += "- T01: Scaffold Next PWA + rotas base + verify"
WriteUtf8NoBom $reportPath $out
Write-Host ("Relatório gerado: " + $reportPath)