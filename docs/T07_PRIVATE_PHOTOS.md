# T07: Private Photos with Signed URLs

**Status**: ✅ VERDE (2026-03-07)  
**Objetivo**: Entregar primeira camada real de imagem do produto: upload privado, signed URL, sem URL pública fixa, degradação segura sem env/bucket.

---

## Resumo

T07 adiciona suporte para upload privado de fotos em reports, armazenadas em bucket privado do Supabase Storage, com acesso via signed URLs temporárias (1 hora de expiração). Fotos são opcionais, visíveis apenas em reports publicados (exceto para moderadores), e o sistema degrada graciosamente quando storage não configurado.

---

## Arquivos criados/modificados

### Configuração de ambiente

**lib/env.ts** (modificado):
- Adicionado `storageBucket` const de `process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- Adicionado `isStorageConfigured(): boolean` - verifica se URL + key + bucket estão presentes
- Adicionado `getStorageBucket()` - throwing getter para bucket
- Adicionado `getStorageBucketSafe()` - safe getter retorna string | null

### SQL e Storage

**supabase/sql/T07_storage_notes.sql** (criado):
- Documenta bucket "sidewalk-private" (PRIVATE, 8MB max, image/jpeg|png|webp)
- Documenta 4 storage policies: INSERT (own folder), UPDATE (own files), DELETE (own files), SELECT (authenticated)
- Setup manual via Supabase Dashboard (não SQL executável)
- Path pattern: `reports/{userId}/{reportId}/{timestamp}-{filename}`
- Signed URL: 1 hora expiry, apenas reports publicados (moderadores veem todos)

### Data Layers (lib/storage/)

**lib/storage/storage-types.ts** (criado):
- `UploadPhotoResult` type com `ok`, `path`, `message`, `reason`
- `SignedUrlResult` type com `ok`, `url`, `message`, `reason`
- Constantes: `MAX_FILE_SIZE` (8 MB), `ALLOWED_MIME_TYPES` (jpeg/png/webp), `SIGNED_URL_EXPIRY_SECONDS` (3600)

**lib/storage/upload-report-photo.ts** (criado):
- `uploadReportPhoto(file: File, userId: string, reportId: string): Promise<UploadPhotoResult>`
- Server-only, valida tipo/tamanho, exige auth, upload para bucket privado
- Path: `reports/{userId}/{reportId}/{timestamp}-{sanitized-filename}`
- Retorna estrutura tipada com degradação segura (não joga throw)

**lib/storage/get-report-photo-signed-url.ts** (criado):
- `getReportPhotoSignedUrl(reportId, photoPath, reportStatus): Promise<SignedUrlResult>`
  - Para usuários comuns: só reports publicados
- `getReportPhotoSignedUrlForModerator(photoPath): Promise<SignedUrlResult>`
  - Para moderadores: qualquer report (validação externa de permissão)
- Ambas retornam signed URL válida por 1 hora

### API Routes

**app/api/reports/photo/upload/route.ts** (criado):
- POST multipart/form-data com `file` e `reportId`
- Valida ownership (report.user_id === user.id)
- Upload via `uploadReportPhoto`
- Atualiza `photo_private_path` do report via direct Supabase update
- Retorna `{ ok, message, path }`

**app/api/reports/photo/signed/route.ts** (criado):
- GET com query param `reportId`
- Busca report, verifica se user é moderador via `getCurrentProfile`
- Se moderador: usa `getReportPhotoSignedUrlForModerator`
- Se público: usa `getReportPhotoSignedUrl` (exige report publicado)
- Retorna `{ ok, url, message }`

### UI Components

**components/reports/report-photo.tsx** (criado):
- Client component para exibir foto de report publicado
- Faz fetch em `/api/reports/photo/signed?reportId={id}`
- Degrada silenciosamente se não houver foto ou erro
- Usa next/image `Image` para otimização

**components/reports/report-photo-moderator.tsx** (criado):
- Variante para moderadores: tenta carregar foto mesmo se report não publicado
- API permite via check de permissão `canModerate`
- Degrada silenciosamente sem foto
- Usa next/image `Image`

### Páginas atualizadas

**app/novo/page.tsx** (modificado):
- Adicionado state: `selectedFile`, `photoPreview`
- Adicionado `handleFileSelect` com validação client-side (tipo, tamanho 8MB)
- Adicionado input de file HTML com preview usando next/image
- Após criar report: tenta upload de foto via `/api/reports/photo/upload` com FormData
- Mensagem de sucesso mostra se foto foi enviada ou falhou
- Subtitle atualizado: menciona foto opcional e privada
- Status card eyebrow: "T07 ativo", mensagem "Foto privada: ativa (opcional, 8 MB max)"

**app/r/[id]/page.tsx** (modificado):
- Importa `ReportPhoto` component
- Exibe foto abaixo da observação do report
- Foto só carrega se report publicado (componente faz validação via API)

**app/admin/moderacao/page.tsx** (modificado):
- Importa `ReportPhotoModerator` component
- Exibe foto em cada card de moderação (após lista de detalhes)
- Moderadores veem fotos mesmo de reports não publicados

**app/page.tsx** (modificado):
- Status de entrega: "Foto privada: ativa (signed URL)." (eyebrow "Camadas ativas")

---

## Fluxo de dados

### Criação de report com foto

1. User preenche formulário em /novo, seleciona foto opcional
2. Validação client-side: tipo (jpeg/png/webp), tamanho max 8MB
3. Preview local via FileReader
4. Submit: POST /api/reports/create (cria report com photo_private_path NULL)
5. Se foto selecionada e reportId retornado:
   - FormData com file + reportId
   - POST /api/reports/photo/upload
   - Valida ownership, faz upload, atualiza photo_private_path
6. Mensagem de sucesso mostra se foto foi enviada ou falhou

### Visualização de foto (usuário comum)

1. User visita /r/[id] de report publicado
2. `ReportPhoto` component monta, faz GET `/api/reports/photo/signed?reportId={id}`
3. API:
   - Busca report, verifica se user é moderador
   - Se não moderador: verifica se report publicado
   - Gera signed URL via `getReportPhotoSignedUrl`
4. Component exibe Image com signed URL (válida por 1h)
5. Se report não publicado, não tem foto, ou erro: degrada silenciosamente (null render)

### Visualização de foto (moderador)

1. Moderador visita /admin/moderacao
2. Para cada report: `ReportPhotoModerator` monta, faz GET `/api/reports/photo/signed?reportId={id}`
3. API:
   - Busca report, verifica se user é moderador via `getCurrentProfile`
   - Se moderador: usa `getReportPhotoSignedUrlForModerator` (ignora status do report)
4. Component exibe Image com signed URL
5. Degrada silenciosamente se não houver foto

---

## Políticas de segurança

### Storage RLS Policies (manual setup via Dashboard)

1. **INSERT policy (own folder)**:
   - Usuários autenticados podem fazer upload apenas em `reports/{auth.uid}/{reportId}/`
   - Previne upload em pastas de outros usuários

2. **UPDATE policy (own files)**:
   - Usuários só podem atualizar arquivos que criaram

3. **DELETE policy (own files)**:
   - Usuários só podem deletar arquivos que criaram

4. **SELECT policy (authenticated)**:
   - Qualquer usuário autenticado pode listar/verificar existência de arquivos
   - Access via signed URL é separado (controlado pelo backend)

### Application-level security

- Upload exige auth (verifica user via supabase.auth.getUser())
- Upload exige ownership (report.user_id === user.id)
- Signed URL só gerada se:
  - Report publicado (para usuários comuns)
  - User é moderador (para qualquer report)
- Signed URLs expiram em 1 hora
- Bucket é PRIVATE (sem acesso público direto)

---

## Degradação segura

Sistema continua funcional sem env/bucket configurado:

- `isStorageConfigured()` retorna false se NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ausente
- Upload retorna `{ ok: false, reason: "env-missing" }` sem throw
- Signed URL retorna `{ ok: false, reason: "env-missing" }` sem throw
- Components degradam silenciosamente (null render) sem foto
- /novo permite criação de reports sem foto (campo opcional)
- /r/[id] funciona sem foto (ReportPhoto degrada)
- /admin/moderacao funciona sem foto (ReportPhotoModerator degrada)

---

## Validações

### Client-side (app/novo/page.tsx)

- Tipo de arquivo: jpeg, png, webp
- Tamanho máximo: 8 MB
- Preview local antes de upload

### Server-side (lib/storage/upload-report-photo.ts)

- Tipo de arquivo: `ALLOWED_MIME_TYPES` (image/jpeg|png|webp)
- Tamanho máximo: `MAX_FILE_SIZE` (8 MB)
- Auth: user !== null && user.id === userId
- Ownership: report.user_id === user.id
- Bucket configurado: `isStorageConfigured()`

### Path sanitization

Filename sanitizado: `file.name.replace(/[^a-zA-Z0-9._-]/g, "_")`  
Path pattern: `reports/{userId}/{reportId}/{timestamp}-{sanitized-filename}`

---

## Testing checklist

### Setup

- [ ] Criar bucket "sidewalk-private" via Supabase Dashboard
- [ ] Configurar bucket como PRIVATE
- [ ] Definir limite de tamanho 8 MB
- [ ] Allowed MIME types: image/jpeg, image/png, image/webp
- [ ] Criar 4 storage policies conforme T07_storage_notes.sql
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=sidewalk-private` a .env.local

### Upload flow

- [ ] Login em /novo
- [ ] Selecionar foto válida (jpeg/png/webp, <8MB): preview aparece
- [ ] Tentar selecionar arquivo inválido (pdf): erro client-side
- [ ] Tentar selecionar arquivo >8MB: erro client-side
- [ ] Criar report com foto: sucesso mostra "(com foto)"
- [ ] Criar report sem foto: sucesso sem menção a foto
- [ ] Verificar no Supabase Storage: arquivo em `reports/{userId}/{reportId}/{timestamp}-{filename}`

### Viewing flow (público)

- [ ] Visitar /r/[id] de report pendente com foto: foto NÃO aparece
- [ ] Moderador publica report
- [ ] Visitar /r/[id] de report publicado com foto: foto aparece
- [ ] Aguardar >1h e recarregar: foto recarrega (novo signed URL)
- [ ] Visitar /r/[id] de report sem foto: nenhum erro, seção de foto ausente

### Viewing flow (moderador)

- [ ] Login como moderador
- [ ] /admin/moderacao mostra reports pendentes com fotos (preview pequeno)
- [ ] Reports sem foto: nenhum erro, apenas ausência de imagem
- [ ] Clicar "Ver detalhe" em report pendente: foto aparece em /r/[id] (moderador vê)

### Degradação

- [ ] Remover `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` do .env.local
- [ ] Recarregar /novo: formulário funciona, sem input de file
- [ ] Criar report sem foto: sucesso normal
- [ ] Visitar /r/[id] publicado que tinha foto: nenhum erro, foto ausente
- [ ] /admin/moderacao: cards de reports funcionam, fotos ausentes

---

## Próximos passos (fora de T07)

- **EXIF stripping**: remover metadados de localização/câmera antes de armazenar
- **Compressão**: otimizar tamanho de imagens no upload
- **Thumbnails**: gerar versões otimizadas para preview (map, moderação)
- **Multiple photos**: permitir 2-3 fotos por report
- **Public photos**: campo `photo_public_path` para fotos sem signed URL (discussão futura)

---

## Verificação

Executar `tools/T07_verify.ps1`:
- Verifica 14 arquivos criados/modificados
- Roda `npm run lint` (exit 0)
- Roda `npm run typecheck` (exit 0)
- Roda `npm run build` (exit 0)
- Conta 18 rotas geradas (incluindo /api/reports/photo/upload e /api/reports/photo/signed)
- Gera report markdown (reports/YYYY-MM-DD-HHMM-T07-private-photos.md)

---

## Dependências

- Supabase Storage configurado (bucket "sidewalk-private" via Dashboard)
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` em .env.local
- T02 schema (photo_private_path já existe em sidewalk_reports)
- T06 moderation (getCurrentProfile com canModerate)

---

## Arquitetura técnica

### Por que signed URLs?

- Bucket privado = sem acesso público direto
- Signed URLs permitem acesso temporário controlado
- Expiry de 1h balanceia segurança e UX (cache razoável)
- Backend controla quem pode ver foto (published vs moderador)

### Por que não photo_public_path agora?

- T07 foca em MVP privado e seguro
- photo_public_path em T02 schema permite futura camada pública
- Decisão de produto: privacidade primeiro, público depois (se necessário)

### Por que FormData no upload?

- Multipart/form-data é padrão HTTP para upload de arquivos
- Next.js Route Handlers suportam nativamente
- Permite envio de file + metadados (reportId) em uma requisição

### Por que próximo após criar report?

- Simplifica fluxo: report existe antes de receber foto
- Evita orphan files (upload sem report correspondente)
- Facilita validação de ownership (report já tem user_id)
- Permite retry de upload sem recriar report

---

## Notas de desenvolvimento

- Build passou com 18 rotas (2 novas: photo/upload, photo/signed)
- Lint passou (0 warnings após substituir `<img>` por next/image `Image`)
- Typecheck passou (tipos completos em storage-types.ts)
- Degradação segura validada (isStorageConfigured, getStorageBucketSafe)
- Components client-side isolados (ReportPhoto, ReportPhotoModerator)
- Server-only data layers (uploadReportPhoto, getReportPhotoSignedUrl)
- Moderação usa variante específica (getReportPhotoSignedUrlForModerator)

---

**FIM T07**
