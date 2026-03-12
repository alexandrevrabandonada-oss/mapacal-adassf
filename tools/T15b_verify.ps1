# T15b_verify.ps1 - Verificação de Payloads Ricos

$ErrorActionPreference = "Stop"

Write-Host "--- T15b Verification Start ---" -ForegroundColor Cyan

# 1. Check Files
$files = @(
    "lib/alerts/fetch-alert-representative-photo.ts",
    "lib/alerts/build-slack-alert-payload.ts",
    "lib/alerts/build-discord-alert-payload.ts",
    "lib/alerts/build-telegram-alert-payload.ts",
    "lib/alerts/deliver-alerts-to-destinations.ts"
)

foreach ($f in $files) {
    if (Test-Path $f) {
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

Write-Host "--- T15b Verification SUCCESS ---" -ForegroundColor Cyan
