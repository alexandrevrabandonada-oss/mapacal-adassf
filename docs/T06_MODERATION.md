# T06: Moderação Operacional

**Objetivo:** Entregar o primeiro painel operacional funcional de moderação, fechando o ciclo entre criação de reports cidadãos e publicação no mapa público.

---

## 1. Visão geral

Antes de T06, o projeto tinha:
- `/novo` criando reports com `status = 'pending'`
- `/mapa` listando apenas `status = 'published'`
- `/r/[id]` com confirmação comunitária (T05)
- Nenhuma ferramenta para alterar status de reports

**Com T06**, entregamos:
- Painel `/admin/moderacao` funcional com autenticação e autorização
- Listagem de reports por status (pending, needs_review, published, hidden)
- Ações de moderação: **publicar**, **ocultar**, **pedir revisão**
- Registro de eventos em `moderation_events`
- Proteção por role `moderator` ou `admin`

---

## 2. Componentes entregues

### SQL

**Arquivo:** `supabase/sql/T06_moderation.sql`

**Helper `is_moderator()`:**
- Verifica se usuário atual (`auth.uid()`) tem role `moderator` ou `admin`.
- Security definer, estável.

**RPC `list_reports_for_moderation(in_status, in_limit)`:**
- Lista reports para moderação com filtro opcional de status.
- Exige autenticação e role moderator/admin.
- Retorna:
  - Campos básicos do report
  - `verification_count` e `is_verified` (join com sidewalk_verifications)
- Ordenação: pending/needs_review primeiro, depois created_at desc.

**RPC `moderate_sidewalk_report(in_report_id, in_action, in_reason)`:**
- Ações aceitas: `publish`, `hide`, `request_review`.
- Exige autenticação e role moderator/admin.
- Comportamento:
  - `publish`: altera status para `published`, limpa needs_review
  - `hide`: altera status para `hidden`, limpa needs_review
  - `request_review`: mantém status atual, marca needs_review = true
- Registra evento em `moderation_events` com moderator_id, action, reason.
- Retorna JSON: `{ ok, message, new_status }`.

**Índices adicionais:**
- `idx_sidewalk_reports_needs_review` (para filtros de revisão)
- `idx_profiles_role` (para checagem rápida de moderadores)

**Como aplicar:**
1. Copie o conteúdo de `supabase/sql/T06_moderation.sql`.
2. No Supabase SQL Editor, cole e execute (Run).
3. Confirme que não há erros (helper + 2 RPCs + 2 índices criados).

---

### Data Layers

**Arquivo:** `lib/auth/get-current-profile.ts`
- `getCurrentProfile(): Promise<CurrentProfileResult>`
- Server-only, obtém usuário atual, busca profile com role.
- Retorna:
  - `ok`, `isAuthenticated`, `userId`, `role`, `canModerate`
  - `reason` se erro (env-missing, not-authenticated, no-profile, db-error)
- Degradação segura sem env.

**Arquivo:** `lib/reports/list-for-moderation.ts`
- `listReportsForModeration(status?, limit): Promise<ListForModerationResult>`
- Server-only, chama RPC `list_reports_for_moderation`.
- Mapeia erros:
  - env-missing, rpc-missing, not-authenticated, permission-denied, db-error.
- Retorna `{ ok, items, message?, reason? }`.

**Arquivo:** `lib/reports/moderate-report.ts`
- `moderateSidewalkReport(reportId, action, reason?): Promise<ModerateReportResult>`
- Server-only, chama RPC `moderate_sidewalk_report`.
- Mapeia erros de forma amigável.
- Retorna `{ ok, message, newStatus?, reason? }`.

---

### API Handlers

**Arquivo:** `app/api/reports/moderation-list/route.ts`
- **GET** `/api/reports/moderation-list?status=pending&limit=100`
- Valida query params, chama data layer.
- Retorna status HTTP apropriado:
  - 200 → ok
  - 401 → not-authenticated
  - 403 → permission-denied
  - 500 → env-missing, rpc-missing, db-error

**Arquivo:** `app/api/reports/moderate/route.ts`
- **POST** `/api/reports/moderate`
- Body: `{ reportId, action, reason? }`
- Valida payload, chama data layer.
- Retorna status HTTP:
  - 200 → ok
  - 400 → invalid payload ou action
  - 401 → not-authenticated
  - 403 → permission-denied
  - 404 → not-found
  - 500 → erros internos

---

### UI

**Arquivo:** `app/admin/moderacao/page.tsx`
- Client component com gerenciamento de estado local.
- **Estados:**
  - loading → confere permissões
  - anonymous → redireciona para /login
  - authenticated sem permissão → exibe mensagem de acesso negado
  - moderator/admin → exibe painel ativo
- **Layout:**
  - Status card mostrando T06 ativo
  - Filtros por status (all, pending, needs_review, published, hidden)
  - Lista de reports moderáveis
- **Cada card exibe:**
  - Condição (good/bad/blocked)
  - Bairro, nota, datas (criado/atualizado)
  - Precisão GPS (accuracy_m)
  - Badges: status, needs_review, verificado (com contagem)
  - Ações: Publicar, Ocultar, Pedir revisão, Ver detalhe
- **Feedback visual:**
  - Loading states
  - Mensagens de sucesso/erro por card
  - Botões desabilitados quando ação já aplicada

**Arquivo:** `app/page.tsx`
- Atualizado card "Status de entrega" para incluir "Moderação operacional: ativa".

---

### Types

**Arquivo:** `types/database.ts`
- Adicionadas assinaturas dos RPCs:
  - `list_reports_for_moderation`
  - `moderate_sidewalk_report`

---

## 3. Fluxo operacional

### 3.1 Acesso ao painel

1. Usuário acessa `/admin/moderacao`.
2. UI verifica sessão via fetch para `/api/reports/moderation-list?status=pending&limit=1`.
3. Se não autenticado → exibe tela de login.
4. Se autenticado sem role moderator/admin → exibe acesso negado.
5. Se moderator/admin → carrega painel ativo.

### 3.2 Listar reports

1. Moderador seleciona filtro (all/pending/needs_review/published/hidden).
2. UI chama `GET /api/reports/moderation-list?status={filtro}`.
3. API chama RPC que valida auth + role.
4. Retorna lista ordenada (pending/needs_review primeiro).

### 3.3 Moderar report

1. Moderador clica em "Publicar", "Ocultar" ou "Pedir revisão".
2. UI chama `POST /api/reports/moderate` com `{ reportId, action, reason? }`.
3. API chama RPC que:
   - Valida auth + role
   - Atualiza status e/ou needs_review
   - Registra evento em moderation_events
4. Retorna resultado.
5. UI atualiza card localmente com feedback visual.

---

## 4. Setup manual

### 4.1 Aplicar SQL

1. Abra Supabase SQL Editor.
2. Cole o conteúdo de `supabase/sql/T06_moderation.sql`.
3. Execute (Run).
4. Confirme que helper + RPCs + índices foram criados.

### 4.2 Promover usuário a moderador

Para testar o painel, você precisa de ao menos 1 usuário com role `moderator` ou `admin`.

**Via Supabase Dashboard:**
1. Vá para **Table Editor** → `public.profiles`.
2. Encontre o registro do seu usuário (id = UUID da conta).
3. Edite a coluna `role` e altere de `user` para `moderator` (ou `admin`).
4. Salve.

**Via SQL Editor:**
```sql
update public.profiles
set role = 'moderator'
where id = 'SEU-UUID-AQUI';
```

### 4.3 Criar report de teste

1. Acesse `/novo`.
2. Preencha condição, lat/lng, bairro.
3. Envie. Report é criado com `status = 'pending'`.

### 4.4 Testar moderação

1. Faça login com a conta que tem role moderator/admin.
2. Acesse `/admin/moderacao`.
3. Veja o report pendente na lista.
4. Clique "Publicar".
5. Verifique feedback de sucesso.
6. Acesse `/mapa` e confirme que o ponto apareceu.

---

## 5. Proteções e degradação

| Cenário | Comportamento |
|---------|---------------|
| SQL T06 não aplicado | API retorna `rpc-missing`. UI degrada sem quebrar. |
| Usuário não autenticado | API retorna 401. UI exibe tela de login. |
| Usuário com role `user` | API retorna 403. UI exibe acesso negado. |
| .env não configurado | Data layer retorna `env-missing`. UI degrada. |
| Report não existe | RPC retorna `ok: false, message: "Report nao encontrado"`. UI exibe erro. |
| Ação inválida | RPC retorna `ok: false, message: "Acao invalida..."`. UI exibe erro. |

**Nenhum desses cenários quebra o build ou a aplicação.**

---

## 6. Limitações atuais

- **Sem paginação:** Lista retorna até `in_limit` (default 100).
- **Sem foto:** Upload de foto entra em T07.
- **Sem notificação:** Autor do report não é notificado quando moderado.
- **Sem auditoria pública:** `moderation_events` existe mas não tem UI de consulta.
- **Sem bulk actions:** Moderador precisa clicar em cada report individualmente.

---

## 7. Por que foto ficou para depois?

Priorizar fluxo operacional antes de adicionar upload/storage mantém:
- **Foco:** Fechar ciclo de criação → moderação → publicação primeiro.
- **Estabilidade:** Menos variáveis em T06, menos superfície de erro.
- **Testabilidade:** Testar moderação sem depender de bucket/signed URLs.

**T07** adicionará:
- Upload de foto privada (visible apenas para moderadores).
- Aprovação de foto para conversão em pública (signed URL exposto).
- Thumbnail para lista de moderação.

---

## 8. Próximos passos

### Após aplicar T06:

1. Promova pelo menos 1 usuário a `moderator` no Supabase Dashboard.
2. Crie reports via `/novo`.
3. Modere via `/admin/moderacao`.
4. Verifique publicação em `/mapa`.

### Possíveis T07/T08:

- **T07:** Foto privada + signed URL + aprovação visual.
- **T08:** Dashboard de transparência com métricas de fila (total pending, tempo médio de moderação, etc.).
- **T09:** Notificações ao autor quando report é moderado.
- **T10:** Bulk actions (publicar N reports de uma vez).

---

**Fim do documento T06.**
