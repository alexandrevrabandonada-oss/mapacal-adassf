# T07_verify.ps1
# Verificacao automatizada: T07 Private Photos
# Rodar: pwsh tools/T07_verify.ps1

param()

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$reportFile = "reports/$timestamp-T07-private-photos.md"

Write-Host ""
Write-Host "=== T07 VERIFY ===" -ForegroundColor Cyan
Write-Host ""

# Checklist de arquivos esperados
$expectedFiles = @(
  "lib\env.ts",
  "supabase\sql\T07_storage_notes.sql",
  "lib\storage\storage-types.ts",
  "lib\storage\upload-report-photo.ts",
  "lib\storage\get-report-photo-signed-url.ts",
  "app\api\reports\photo\upload\route.ts",
  "app\api\reports\photo\signed\route.ts",
  "components\reports\report-photo.tsx",
  "components\reports\report-photo-moderator.tsx",
  "app\novo\page.tsx",
  "app\r\``[id``]\page.tsx",
  "app\admin\moderacao\page.tsx",
  "app\page.tsx",
  "docs\T07_PRIVATE_PHOTOS.md",
  "tools\T07_verify.ps1"
)

$filesOk = $true
foreach ($file in $expectedFiles) {
  if (Test-Path $file) {
    Write-Host "[OK] $file" -ForegroundColor Green
  } else {
    Write-Host "[MISSING] $file" -ForegroundColor Red
    $filesOk = $false
  }
}

Write-Host ""

# Lint
Write-Host "Running npm run lint..." -ForegroundColor Yellow
$lintOutput = npm run lint 2>&1 | Out-String
$lintExit = $LASTEXITCODE
if ($lintExit -eq 0) {
  Write-Host "[PASS] lint exit $lintExit" -ForegroundColor Green
} else {
  Write-Host "[WARN] lint exit $lintExit" -ForegroundColor Yellow
}

# Typecheck
Write-Host "Running npm run typecheck..." -ForegroundColor Yellow
$tcOutput = npm run typecheck 2>&1 | Out-String
$tcExit = $LASTEXITCODE
if ($tcExit -eq 0) {
  Write-Host "[PASS] typecheck exit $tcExit" -ForegroundColor Green
} else {
  Write-Host "[FAIL] typecheck exit $tcExit" -ForegroundColor Red
}

# Build
Write-Host "Running npm run build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1 | Out-String
$buildExit = $LASTEXITCODE
if ($buildExit -eq 0) {
  Write-Host "[PASS] build exit $buildExit" -ForegroundColor Green
} else {
  Write-Host "[FAIL] build exit $buildExit" -ForegroundColor Red
}

# Contar rotas geradas
$routeCount = 0
if ($buildOutput -match "Route \(app\)") {
  $routeLines = ($buildOutput -split "`n" | Select-String -Pattern "^\s*(┌|├|└)\s*(○|ƒ)\s+/")
  $routeCount = $routeLines.Count
}

Write-Host ""
Write-Host "Rotas geradas: $routeCount (esperado: 18)" -ForegroundColor Cyan

# Gerar relatorio
Write-Host ""
Write-Host "Gerando relatorio: $reportFile" -ForegroundColor Cyan

# Construir checklist de arquivos
$fileChecklistLines = $expectedFiles | ForEach-Object {
  if (Test-Path $_) {
    "OK: ``$_``"
  } else {
    "FALTANDO: ``$_``"
  }
}
$fileChecklist = $fileChecklistLines -join "`n"

$reportContent = @"
# T07 Private Photos - Relatorio de Verificacao
**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Resumo

T07 entrega **foto privada com signed URLs**: upload opcional em /novo, armazenamento em bucket privado do Supabase Storage, acesso via signed URLs temporárias (1h expiry) apenas para reports publicados (exceto moderadores), degradação segura sem env/bucket.

---

## Arquivos verificados

$fileChecklist

Total: $($expectedFiles.Count) arquivos  
Status: $(if($filesOk){"✅ TODOS PRESENTES"}else{"❌ ARQUIVOS FALTANDO"})

---

## Comandos executados

### lint
Exit code: $lintExit  
Status: $(if($lintExit -eq 0){"✅ PASS"}else{"⚠️ WARN"})

### typecheck
Exit code: $tcExit  
Status: $(if($tcExit -eq 0){"✅ PASS"}else{"❌ FAIL"})

### build
Exit code: $buildExit  
Status: $(if($buildExit -eq 0){"✅ PASS"}else{"❌ FAIL"})

Rotas geradas: $routeCount (esperado: 18 = 16 anteriores + 2 novas photo routes)

---

## Output dos comandos

### lint output
``````
$lintOutput
``````

### typecheck output
``````
$tcOutput
``````

### build output (primeiras 100 linhas)
``````
$($buildOutput -split "`n" | Select-Object -First 100 | Out-String)
``````

---

## Camadas implementadas

### Configuração
- lib/env.ts: storageBucket, isStorageConfigured, getStorageBucket, getStorageBucketSafe

### SQL/Storage
- supabase/sql/T07_storage_notes.sql: documentação de bucket e policies (setup manual)

### Data layers
- lib/storage/storage-types.ts: UploadPhotoResult, SignedUrlResult, constantes
- lib/storage/upload-report-photo.ts: uploadReportPhoto() server-only com validação
- lib/storage/get-report-photo-signed-url.ts: getReportPhotoSignedUrl() + versão moderador

### API
- app/api/reports/photo/upload/route.ts: POST multipart/form-data
- app/api/reports/photo/signed/route.ts: GET com reportId query param

### Components
- components/reports/report-photo.tsx: client component para reports publicados
- components/reports/report-photo-moderator.tsx: variante para moderadores

### UI
- app/novo/page.tsx: file input, preview, upload após criar report
- app/r/[id]/page.tsx: ReportPhoto component exibindo foto
- app/admin/moderacao/page.tsx: ReportPhotoModerator em cards de moderação
- app/page.tsx: status "Foto privada: ativa (signed URL)"

---

## Validações implementadas

### Client-side (app/novo/page.tsx)
- Tipo: jpeg, png, webp
- Tamanho max: 8 MB
- Preview local antes de upload

### Server-side (lib/storage/upload-report-photo.ts)
- ALLOWED_MIME_TYPES validação
- MAX_FILE_SIZE validação
- Auth check (user.id === userId)
- Ownership check (report.user_id === user.id)
- Path sanitization: /[^a-zA-Z0-9._-]/g → "_"

### Security
- Bucket PRIVATE (sem acesso público direto)
- Signed URLs expiram em 1 hora
- Apenas reports publicados para público
- Moderadores podem ver fotos de qualquer report
- Storage policies RLS (INSERT own folder, UPDATE/DELETE own files, SELECT authenticated)

---

## Fluxo de dados

### Upload flow
1. User seleciona foto em /novo (opcional, validação client-side)
2. Submit cria report (POST /api/reports/create)
3. Se foto selecionada: POST /api/reports/photo/upload (FormData)
4. Upload valida ownership e faz upload para bucket
5. Atualiza photo_private_path do report
6. Mensagem mostra "(com foto)" ou "(foto falhou)"

### Viewing flow (público)
1. User visita /r/[id] de report publicado
2. ReportPhoto component faz GET /api/reports/photo/signed
3. API verifica se report publicado, gera signed URL
4. Component exibe Image com signed URL (1h validade)
5. Degrada silenciosamente se não houver foto

### Viewing flow (moderador)
1. Moderador visita /admin/moderacao
2. ReportPhotoModerator faz GET /api/reports/photo/signed
3. API verifica canModerate, usa getReportPhotoSignedUrlForModerator
4. Moderador vê fotos mesmo de reports não publicados

---

## Degradação segura

- isStorageConfigured() retorna false se env ausente
- Upload retorna { ok: false, reason: "env-missing" }
- Signed URL retorna { ok: false, reason: "env-missing" }
- Components degradam silenciosamente (null render)
- /novo funciona sem foto (opcional)
- /r/[id] funciona sem foto
- /admin/moderacao funciona sem foto

---

## Próximos passos (fora de T07)

- EXIF stripping: remover metadados de localização/câmera
- Compressão: otimizar tamanho de imagens
- Thumbnails: versões otimizadas para preview
- Multiple photos: 2-3 fotos por report
- Public photos: campo photo_public_path para fotos sem signed URL

---

## Resultado final

$(if($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0){"✅ **T07 VERDE**: Todos os checks passaram. Sistema pronto para deploy."}else{"⚠️ **T07 COM PENDENCIAS**: Revisar erros acima antes de deploy."})

---

**FIM VERIFICACAO T07**
"@

# Criar diretorio reports se não existir
if (-not (Test-Path "reports")) {
  New-Item -ItemType Directory -Path "reports" | Out-Null
}

# Escrever relatorio
Set-Content -Path $reportFile -Value $reportContent -Encoding UTF8

Write-Host ""
Write-Host "Relatorio salvo: $reportFile" -ForegroundColor Green
Write-Host ""

# Summary final
if ($filesOk -and $lintExit -eq 0 -and $tcExit -eq 0 -and $buildExit -eq 0) {
  Write-Host "=== T07 VERDE ===" -ForegroundColor Green
  Write-Host "Todos os checks passaram. Sistema pronto." -ForegroundColor Green
  exit 0
} else {
  Write-Host "=== T07 COM PENDENCIAS ===" -ForegroundColor Yellow
  Write-Host "Revisar relatorio: $reportFile" -ForegroundColor Yellow
  exit 1
}
