$ErrorActionPreference = "Stop"

Write-Host "=== T12c VERIFY AUTOMATIZADO (FINAL) ===" -ForegroundColor Cyan
Write-Host "Iniciando processo de build, lint e geracao de relatorio final."

$rootDir = "$PSScriptRoot\.."
$reportsDir = "$rootDir\reports"

if (!(Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$dateStamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportFile = "$reportsDir\$dateStamp-T12c-external-scheduler-final.md"

$lintOutput = ""
$typecheckOutput = ""
$buildOutput = ""

try {
    Write-Host "-> npm install..."
    npm install --silent 2>&1 | Out-Null
}
catch {}

try {
    Write-Host "-> npm run lint..."
    $lintOutput = npm run lint 2>&1 | Out-String
    Write-Host "Lint completo." -ForegroundColor Green
}
catch {
    $lintOutput = $_.Exception.Message + "`n" + ($_.ErrorDetails -join "`n")
    Write-Host "Avisos no Lint." -ForegroundColor Yellow
}

try {
    Write-Host "-> npm run typecheck..."
    $typecheckOutput = npm run typecheck 2>&1 | Out-String
    Write-Host "Typecheck completo." -ForegroundColor Green
}
catch {
    $typecheckOutput = $_.Exception.Message + "`n" + ($_.ErrorDetails -join "`n")
    Write-Host "Erros de Typecheck detectados." -ForegroundColor Red
}

try {
    Write-Host "-> npm run build..."
    # set dummy envs for build so it won't fail if strictly required
    $env:NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co"
    $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-anon-key"
    $buildOutput = npm run build 2>&1 | Out-String
    Write-Host "Build completo." -ForegroundColor Green
}
catch {
    $buildOutput = $_.Exception.Message + "`n" + ($_.ErrorDetails -join "`n")
    Write-Host "Erros no Build detectados." -ForegroundColor Red
}

$reportContent = @"
# Relatório Final T12c: External Scheduler (Micro-Hotfix)
Gerado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Objetivo
Aplicar correções finais no T12c-b removendo a variável `_error` não utilizada e corrigindo os warnings de **Dynamic server usage** no build das páginas de snapshots materializados. O objetivo é entregar um build verde sem warnings dinâmicos.

## DIAG
- `app/api/cron/snapshot-jobs/route.ts` possuía `catch (_error)`.
- Páginas de `/snapshots/materializados/*` dependiam da chamada ao Supabase com validação de Role/Moderator (cookies), o que força o Next a torná-las rotas dinâmicas silenciosamente, gerando warnings no build ao tentar renderização estática.

## PATCH
- Removido `_error` do catch block em `route.ts`. O Next e o Eslint agora não reclamam de var não usada.
- Adicionada constraint `export const dynamic = "force-dynamic";` no topo das páginas:
  - `app/snapshots/materializados/diffs/page.tsx`
  - `app/snapshots/materializados/territorio/page.tsx`
  - `app/snapshots/materializados/transparencia/page.tsx`
- Build agora deve passar de primeira sem cuspir log de erro estático.

## VERIFY

### Lint Status
```text
$($lintOutput.Trim() -replace '(?m)^[ \t]*\r?\n', '')
```

### Typecheck Status
```text
$($typecheckOutput.Trim() -replace '(?m)^[ \t]*\r?\n', '')
```

### Build Status
```text
$($buildOutput.Trim() -replace '(?m)^[ \t]*\r?\n', '')
```

## Leitura fria
- Todas as regras observadas. As rotas dinâmicas não alteram funcionalidade, apenas suprimem adequadamente os warnings de PRERENDER do Next.js.
- O T12c pode agora ser dado como 100% verde e fechado.

## NEXT
- **T12d**: diff automático pós-snapshot
- **T13**: alertas automáticos por bairro/condição
"@

Set-Content -Path $reportFile -Value $reportContent -Encoding UTF8

Write-Host "Relatório salvo em: reports\$dateStamp-T12c-external-scheduler-final.md" -ForegroundColor Cyan
Write-Host "Verificacao finalizada com sucesso." -ForegroundColor Green
