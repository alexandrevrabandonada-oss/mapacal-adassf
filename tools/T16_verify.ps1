# T16_verify.ps1 - Verificação de Share Packs

$ErrorActionPreference = "Stop"

Write-Host "--- T16 Verification Start ---" -ForegroundColor Cyan

# 1. Check Files
$files = @(
    "lib/share/share-pack-types.ts",
    "lib/share/share-pack-utils.ts",
    "lib/share/build-alert-share-pack.ts",
    "lib/share/build-snapshot-share-pack.ts",
    "lib/share/build-diff-share-pack.ts",
    "lib/share/get-alert-share-data.ts",
    "lib/share/get-snapshot-share-data.ts",
    "lib/share/get-diff-share-data.ts",
    "components/share/share-pack-drawer.tsx",
    "components/share/share-actions.tsx",
    "components/share/share-pack-preview.tsx",
    "components/share/share-copy-buttons.tsx",
    "app/api/share/alertas/[id]/route.ts",
    "app/api/share/snapshots/transparencia/[id]/route.ts",
    "app/api/share/snapshots/territorio/[id]/route.ts",
    "app/api/share/snapshots/diffs/[id]/route.ts",
    "docs/T16_SHARE_PACKS.md"
)

foreach ($f in $files) {
    if (Test-Path -LiteralPath $f) {
        Write-Host "[OK] File exists: $f" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Missing file: $f" -ForegroundColor Red
        exit 1
    }
}

# 2. Lint
Write-Host "Running Lint..." -ForegroundColor Yellow
npm run lint --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Lint failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Lint passed" -ForegroundColor Green

# 3. Typecheck
Write-Host "Running Typecheck..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Typecheck failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Typecheck passed" -ForegroundColor Green

# 4. Build
Write-Host "Running Build..." -ForegroundColor Yellow
$env:APP_BASE_URL="http://localhost:3000"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Build passed" -ForegroundColor Green

Write-Host "--- T16 Verification SUCCESS ---" -ForegroundColor Cyan
