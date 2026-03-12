# T11b: Snapshots Materializados & Diffs Congelados

## O que é T11b?

T11b entrega **snapshots materializados** e **diffs congelados** para infraestrutura de plataforma pública:

- **Snapshot**: Fotografia congelada dos dados agregados em uma data/hora específica
- **Diff**: Comparação entre dois snapshots, também congelada

Diferente de T11 (comparativos móveis com `?days=30`), snapshots T11b permanecem estáveis e podem ser compartilhados, citados, e revisitados depois.

## Componentes Criados

### 1. SQL: `supabase/sql/T11b_materialized_snapshots.sql`

#### Tabelas

**`public_snapshots`**
- Armazena snapshots materializados
- Campos: `id`, `kind` (transparency|territory), `title`, `days`, `neighborhood`, `snapshot_at`, `data` (jsonb), `created_by`, `is_public`, `created_at`, `updated_at`
- RLS: leitura pública para `is_public = true`, criação apenas moderator/admin

**`public_snapshot_diffs`**
- Armazena diffs congelados entre dois snapshots
- Campos: `id`, `kind`, `from_snapshot_id`, `to_snapshot_id`, `title`, `diff_data` (jsonb), `created_by`, `is_public`, `created_at`, `updated_at`
- Constraints: `from_snapshot_id != to_snapshot_id`, kinds devem coincidir
- RLS: leitura pública para `is_public = true`, criação apenas moderator/admin

#### RPCs

1. **`create_public_snapshot(in_kind, in_days, in_neighborhood, in_title)`**
   - Cria snapshot materializado
   - Requer auth.uid() + moderator/admin
   - Retorna: `{ok, message, snapshot_id}`
   - Validações: kind em [transparency, territory], days em [7, 30, 90, 365]

2. **`list_public_snapshots(in_kind, in_limit)`**
   - Lista snapshots públicas
   - Retorna: `[{id, kind, title, days, neighborhood, snapshot_at, created_at}]`

3. **`get_public_snapshot_by_id(in_snapshot_id)`**
   - Retorna snapshot completo (json)
   - Estrutura: `{id, kind, title, days, neighborhood, snapshot_at, created_at, data}`

4. **`create_public_snapshot_diff(in_from_snapshot_id, in_to_snapshot_id, in_title)`**
   - Cria diff congelado
   - Requer auth.uid() + moderator/admin
   - Validações: snapshots existem, mesmo kind, diferentes
   - Retorna: `{ok, message, diff_id}`

5. **`list_public_snapshot_diffs(in_kind, in_limit)`**
   - Lista diffs públicas
   - Retorna: `[{id, kind, title, from_snapshot_id, to_snapshot_id, created_at}]`

6. **`get_public_snapshot_diff_by_id(in_diff_id)`**
   - Retorna diff completo (json)
   - Estrutura: `{id, kind, title, from_snapshot_id, to_snapshot_id, created_at, diff_data}`

#### Helper

**`is_moderator()`**
- True se `auth.jwt()->>'user_role'` em [moderator, admin]

### 2. Camada de Dados

Seis funções em `lib/snapshots/`:

- **`create-public-snapshot.ts`**: Cria snapshot via RPC
- **`list-public-snapshots.ts`**: Lista snapshots (tipo seguro)
- **`get-public-snapshot-by-id.ts`**: Carrega snapshot by id
- **`create-public-snapshot-diff.ts`**: Cria diff via RPC
- **`list-public-snapshot-diffs.ts`**: Lista diffs (tipo seguro)
- **`get-public-snapshot-diff-by-id.ts`**: Carrega diff by id

**Padrão de Retorno**:
```typescript
{
  ok: boolean;
  data|items|snapshot|diff: Type | null;
  message?: string;
  reason?: "env-missing" | "rpc-missing" | "db-error" | "unauthorized" | "not-found";
}
```

**Degradação Segura**:
- Env ausente → ok: false, reason: "env-missing"
- RPC não aplicada → ok: false, reason: "rpc-missing"
- Erro DB → ok: false, reason: "db-error"
- Sem permissão → ok: false, reason: "unauthorized"

### 3. Componentes React

Seis componentes em `components/snapshots/`:

1. **`snapshot-list.tsx`** (Client)
   - Lista snapshots com "Ver" e "Selecionar"
   - Mobile-friendly

2. **`snapshot-create-form.tsx`** (Client)
   - Formulário para criar snapshot
   - Campos: kind, days, neighborhood (opt), title (opt)
   - Validação e feedback

3. **`snapshot-diff-create-form.tsx`** (Client)
   - Formulário para criar diff
   - Seleccionadores de Snapshot A e B
   - Filtra compatibilidade por kind

4. **`snapshot-summary-card.tsx`** (Server)
   - Exibe metadados de snapshot
   - Cards formatados com kind, days, data congelada

5. **`snapshot-diff-summary.tsx`** (Server)
   - Exibe metadados de Snapshot A vs B
   - Timeline visual

6. **`materialized-note.tsx`** (Server)
   - Explica diferença: snapshot vs comparativo móvel
   - Explica: diff não presume causalidade

### 4. Páginas Públicas

Três páginas estáveis por ID:

1. **`app/snapshots/transparencia/[id]/page.tsx`**
   - Exibe snapshot de transparência congelado
   - Sumário de publicados/verificados/bloqueados
   - Link para compartilhamento

2. **`app/snapshots/territorio/[id]/page.tsx`**
   - Exibe snapshot de território congelado
   - Sumário de prioridades por bairro
   - Link para compartilhamento

3. **`app/snapshots/diffs/[id]/page.tsx`**
   - Exibe diff congelado (A vs B)
   - Metadados de ambos snapshots
   - Dados de comparação
   - Metodologia: "diff não é causalidade"

### 5. Admin: Gerenciador de Snapshots

**`app/admin/snapshots/page.tsx`** (Client Component)

Funcionalidades:
- Criar snapshot transparency
- Criar snapshot territory
- Listar snapshots existentes
- Selecionar dois snapshots + criar diff
- Listar diffs existentes

Endpoints chamados:
- `POST /api/admin/snapshots/create`
- `GET /api/admin/snapshots/list`
- `POST /api/admin/snapshots/diff/create`
- `GET /api/admin/snapshots/diffs/list`

### 6. API Routes

Quatro endpoints de admin + um público:

1. **`POST /api/admin/snapshots/create`**
   - Body: `{kind, days, neighborhood?, title?}`
   - Retorna: `{ok, snapshotId}`

2. **`GET /api/admin/snapshots/list`**
   - Query: `kind?`, `limit?`
   - Retorna: `{ok, items: [...]}`

3. **`POST /api/admin/snapshots/diff/create`**
   - Body: `{fromSnapshotId, toSnapshotId, title?}`
   - Retorna: `{ok, diffId}`

4. **`GET /api/admin/snapshots/diffs/list`**
   - Query: `kind?`, `limit?`
   - Retorna: `{ok, items: [...]}`

5. **`GET /api/exports/snapshot.json`** (Público)
   - Query: `id`, `type` (snapshot|diff)
   - Retorna: JSON materializado com Content-Disposition attachment

### 7. Tipos

Adicionado a `types/database.ts`:
- `public_snapshots` Table definition
- `public_snapshot_diffs` Table definition

## Diferença: Snapshot vs Comparativo Móvel

| Aspecto | Snapshot T11b | Comparativo T11 |
|---------|---------------|-----------------|
| **Congelamento** | Sim, data/hora fixa | Não, muda com o tempo |
| **Compartilhabilidade** | Via link estável (ID) | Via query params (?days=30) |
| **Armazenamento** | Banco de dados (JSONB) | Recalculado por query |
| **Citabilidade** | Sim, ID imutável | Não, link não-estável |
| **Caso de uso** | Documetação, relatórios, auditorias | Exploração ad-hoc |

## Como Usar

### Pré-requisitos

1. **Aplicar SQL**:
   ```bash
   # No Supabase SQL Editor, copie/cole:
   # supabase/sql/T11b_materialized_snapshots.sql
   ```

2. **Promover usuário a moderator/admin**
   - Na Supabase Console, tabela `profiles`, altere `role` para `moderator` ou `admin`

### Criar Snapshot

1. Acesse `/admin/snapshots`
2. Escolha "Novo Snapshot: Transparencia" ou "Novo Snapshot: Territorio"
3. Selecione período (7/30/90/365 dias)
4. (Territorio) Opcionalmente escolha bairro
5. (Opcional) Adicione título
6. Clique "Criar Snapshot"

### Ver Snapshot

- Clique "Ver" no snapshot listado
- Ou acesse `/snapshots/transparencia/[id]` ou `/snapshots/territorio/[id]`

### Criar Diff

1. Em `/admin/snapshots`, seção "Novo Diff"
2. Selecione Snapshot A (de)
3. Selecione Snapshot B (para) — lista filtra por kind
4. (Opcional) Adicione título
5. Clique "Criar Diff"

### Ver Diff

- Link gerado após criação
- Ou acesse `/snapshots/diffs/[id]`

### Exportar JSON

- GET `/api/exports/snapshot.json?id=[id]&type=snapshot`
- GET `/api/exports/snapshot.json?id=[id]&type=diff`

## Estrutura de Dados

### Snapshot JSON

```json
{
  "id": "uuid",
  "kind": "transparency" | "territory",
  "title": "string?",
  "days": 30,
  "neighborhood": "string?",
  "snapshot_at": "2025-03-09T10:31:00Z",
  "created_at": "2025-03-09T10:31:00Z",
  "data": {
    "metadata": {
      "kind": "transparency",
      "days": 30,
      "snapshot_at": "2025-03-09T10:31:00Z",
      "description": "..."
    },
    "summary": {
      "total_published": 150,
      "total_verified": 45,
      "total_blocked": 12
    },
    "note": "Dados completos preenchidos ao aplicar SQL T08+..."
  }
}
```

### Diff JSON

```json
{
  "id": "uuid",
  "kind": "transparency" | "territory",
  "title": "string?",
  "from_snapshot_id": "uuid",
  "to_snapshot_id": "uuid",
  "created_at": "2025-03-09T10:32:00Z",
  "diff_data": {
    "kind": "transparency",
    "from_snapshot_id": "uuid",
    "to_snapshot_id": "uuid",
    "created_at": "2025-03-09T10:32:00Z",
    "comparison_note": "Diff materializado...",
    "summary": {
      "magnitude_delta": null,
      "direction": null
    }
  }
}
```

## Limites Atuais

1. **Preenchimento Manual**: Snapshots devem ser criados manualmente via admin
2. **Sem Automação**: Não há agenda que crie snapshots daily/weekly (veja T12b)
3. **Data Limitada**: Snapshot carrega apenas estrutura; detalhes dependem de SQL T08, T09, T10
4. **Diff Simples**: Diff atual é estrutural; comparação real depende de SQL T08+
5. **Sem Histórico de Edições**: Snapshots são immutáveis; não há versioning de snapshot

## Próximos Passos (T12, T12b, T13)

- **T12**: Timeline visual / Hotspots no Tempo — visualize snapshots em linha do tempo
- **T12b**: Automação Diária de Snapshots — crie snapshots automaticamente via Supabase Cron / Functions
- **T13**: OG Cards por Snapshot — gere Open Graph cards para compartilhamento em redes sociais

## Segurança

- RLS: Snapshots públicos legíveis por todos; criação apenas moderator/admin
- Auth: `auth.uid()` verificado em criação de snapshot/diff
  Role verificado via `is_moderator()` (JWT)
- Dados: Snapshots contêm apenas agregados públicos; nenhum dado privado

## Troubleshooting

### "SQL T11b nao aplicada"

- No Supabase SQL Editor, rode `supabase/sql/T11b_materialized_snapshots.sql`

### "Sem permissao para criar snapshots"

- Verifique seu role em `profiles.role` — deve ser `moderator` ou `admin`

### Snapshot vazio / sem detalhes

- Verifique: SQL T08, T09, T10 já foram aplicadas?
- Snapshots herdam dados calculados por T08+; sem t08, snapshot é apenas estrutura

### Diff não calcula magnitude

- Depende de T08+ SQL aplicada e dados preenchidos
- Atualmente diff é estrutural; magnitude_delta retorna null até mais contexto

## Arquivos Criados/Modificados

### Criados
- ✅ `supabase/sql/T11b_materialized_snapshots.sql`
- ✅ `lib/snapshots/{create,list,get}-public-snapshot.ts` (3 arquivos)
- ✅ `lib/snapshots/{create,list,get}-public-snapshot-diff.ts` (3 arquivos)
- ✅ `components/snapshots/{list,form,diff-form,summary,diff-summary,note}.tsx` (6 arquivos)
- ✅ `app/snapshots/transparencia/[id]/page.tsx`
- ✅ `app/snapshots/territorio/[id]/page.tsx`
- ✅ `app/snapshots/diffs/[id]/page.tsx`
- ✅ `app/admin/snapshots/page.tsx`
- ✅ `app/api/admin/snapshots/{create,list}/route.ts`
- ✅ `app/api/admin/snapshots/diff/{create}/route.ts`
- ✅ `app/api/admin/snapshots/diffs/list/route.ts`
- ✅ `app/api/exports/snapshot.json/route.ts`
- ✅ `docs/T11B_MATERIALIZED_SNAPSHOTS.md`

### Modificados
- ✅ `types/database.ts` (adicionar public_snapshots + public_snapshot_diffs)

### Não Modificados (Intactos)
- `app/comparativos/page.tsx` — ainda funcionando
- `app/transparencia/page.tsx` — ainda funcionando
- `app/territorio/page.tsx` — ainda funcionando
- `app/mapa/page.tsx` — ainda funcionando
- Todos os T08-T11 em verde

## Resumo DIAG → PATCH → VERIFY

**DIAG**: Confirmado estado T10 completo, nenhuma estrutura T11b existente
**PATCH**: Implementado 21 arquivos novos + 1 tipo update
**VERIFY**: Lint → Typecheck → Build (todos passando)
