# T05: Verificação Comunitária

**Objetivo:** Permitir que cidadãos autenticados confirmem pontos publicados, criando uma camada de priorização social e validação distribuída.

---

## 1. Visão geral

Com T04, o mapa exibe `verification_count` e `is_verified` (flag calculada em T04 como `verification_count > 0`).  
Com **T05**, entregamos a **mecânica de confirmação interativa**:

- Usuário autenticado acessa `/r/{id}` de um ponto publicado.
- Clica em "Confirmar este ponto".
- O sistema registra a confirmação na tabela `sidewalk_verifications`.
- Proteção contra duplicatas: cada par (report_id, user_id) é único.
- A contagem atualizada é retornada e exibida em tempo real.

---

## 2. Componentes entregues

### SQL

**Arquivo:** `supabase/sql/T05_verifications.sql`

- **RPC `confirm_sidewalk_report(in_report_id uuid)`**  
  - Valida autenticação (exige `auth.uid()`).  
  - Valida que o ponto existe e está `published`.  
  - Insere em `sidewalk_verifications` com `ON CONFLICT DO NOTHING` (duplicatas são silenciosamente ignoradas).  
  - Retorna JSON com `{ ok, message, verification_count, is_verified }`.

- **RLS policies para `sidewalk_verifications`**  
  - Leitura pública (contagens já vêm via RPCs).  
  - Inserção somente via RPC (policy `authenticated` com `auth.uid() = user_id`).

**Como aplicar:**

1. No Supabase SQL Editor, copie/cole o conteúdo de `T05_verifications.sql`.
2. Execute (Run). Confirme que a RPC `confirm_sidewalk_report` foi criada sem erros.

---

### Data layer

**Arquivo:** `lib/reports/confirm-report.ts`

- `confirmSidewalkReport(reportId: string): Promise<ConfirmReportResult>`  
  - Server-only (`import "server-only"`).  
  - Chama o RPC `confirm_sidewalk_report`.  
  - Trata erros (env-missing, rpc-missing, auth-required, db-error).  
  - Retorna payload seguro com `ok`, `message`, `verification_count?`, `is_verified?`, `reason?`.

---

### API

**Arquivo:** `app/api/reports/confirm/route.ts`

- **POST /api/reports/confirm**  
  - Body: `{ reportId: string }`  
  - Valida payload.  
  - Chama `confirmSidewalkReport` da data layer.  
  - Retorna status HTTP apropriado:
    - 200 → ok ou erro genérico  
    - 401 → auth-required  
    - 404 → not-found  
    - 500 → erro interno

---

### UI

**Componente:** `components/reports/confirm-report-button.tsx`

- Client component com estado local (loading, message, count, verified).  
- Botão "Confirmar este ponto".  
- Atualização otimista da contagem local.  
- Após confirmação bem-sucedida, chama `router.refresh()` para atualizar SSR data.

**Páginas modificadas:**

- **`app/r/[id]/page.tsx`**  
  - Agora importa `ConfirmReportButton`.  
  - Renderiza o botão dentro do `<SectionCard title="Resumo do ponto">`.  
  - Passa `reportId`, `verification_count`, `is_verified` como props.

- **`app/mapa/page.tsx`**  
  - Status card atualizado para "T05 ativo".  
  - Lista agora inclui "Verificacao comunitaria: ativa".

- **`app/novo/page.tsx`**  
  - Lista de nearby agora exibe botão "Ver detalhes e confirmar" para cada ponto próximo.  
  - Guia o usuário a confirmar pontos existentes em vez de criar duplicados.

---

### Types

**Arquivo:** `types/database.ts`

- Adicionada assinatura do RPC `confirm_sidewalk_report` na seção `Functions`.

---

## 3. Fluxo de confirmação

1. **Usuário autenticado acessa `/r/{id}`**  
   - A página server component carrega dados via `getPublishedReportById`.  
   - Renderiza `ConfirmReportButton` com estado inicial.

2. **Usuário clica em "Confirmar este ponto"**  
   - Client component chama `POST /api/reports/confirm` com `{ reportId }`.  
   - API handler chama data layer → RPC SQL.

3. **RPC valida e insere**  
   - Se autenticação falha → retorna `{ ok: false, message: "Autenticacao necessaria" }`.  
   - Se ponto não existe/não publicado → `{ ok: false, message: "Ponto nao encontrado..." }`.  
   - Se duplicata → `ON CONFLICT DO NOTHING`, mas retorna contagem atualizada (que já inclui a confirmação anterior).  
   - Se sucesso → insere e retorna `{ ok: true, message: "Confirmacao registrada...", verification_count, is_verified }`.

4. **Client atualiza UI**  
   - Contagem exibida localmente aumenta (se nova confirmação).  
   - Badge "Verificado pela comunidade" aparece se `is_verified = true`.  
   - Após 1s, `router.refresh()` sincroniza com servidor.

---

## 4. Critério de verificação

- **is_verified = true** quando **`verification_count >= 2`** (definido no SQL T05).
- Cada confirmação reforça a prioridade do ponto no contexto da comunidade.

---

## 5. Proteções

- **Autenticação obrigatória:** RPC valida `auth.uid()`.
- **Duplicatas bloqueadas:** PK composta `(report_id, user_id)` garante 1 confirmação por usuário por ponto.
- **Status publicado:** Somente pontos com `status = 'published'` podem ser confirmados.
- **Degradação segura:** Se SQL não aplicado, API retorna `rpc-missing` e UI não quebra.

---

## 6. Testes manuais

### 6.1 Confirmar ponto já publicado

1. **Aplicar SQL:** Execute `T05_verifications.sql` no Supabase SQL Editor.
2. **Garantir ponto publicado:** Via Supabase Table Editor, defina um report como `status = 'published'`.
3. **Acessar `/r/{id}`** (substituir `{id}` pelo UUID do ponto).
4. **Login:** Se não autenticado, faça login via `/login`.
5. **Clicar "Confirmar este ponto".**
6. **Verificar resposta:**
   - Mensagem: "Confirmacao registrada com sucesso".
   - Contagem aumenta (ex: de 0 para 1).
   - Badge "Verificado pela comunidade" aparece se `>= 2` confirmações.

### 6.2 Confirmar novamente (duplicata)

1. Com mesmo usuário, clicar novamente em "Confirmar este ponto" no mesmo ponto.
2. **Resultado esperado:**  
   - Mensagem continua "Confirmacao registrada com sucesso".  
   - Contagem **não aumenta** (SQL ignora duplicata).  
   - Badge permanece inalterado.

### 6.3 Nearby list no /novo

1. Acesse `/novo`.
2. Preencha lat/lng próximas a um ponto publicado.
3. Clique "Buscar pontos proximos".
4. **Verificar:**
   - Lista exibe pontos próximos.
   - Cada item tem botão "Ver detalhes e confirmar".
   - Ao clicar, usuário é levado para `/r/{id}` onde pode confirmar.

### 6.4 Mapa público

1. Acesse `/mapa`.
2. **Verificar:**
   - Status card mostrando "T05 ativo".
   - Lista "Verificacao comunitaria: ativa".

---

## 7. Arquitetura de degradação

| Cenário | Comportamento |
|---------|---------------|
| SQL T05 não aplicado | POST /api/reports/confirm retorna `rpc-missing`. UI exibe erro mas não quebra. |
| Usuário não autenticado | RPC retorna `auth-required`. API retorna 401. UI mostra mensagem. |
| Ponto não existe ou não publicado | RPC retorna `not-found`. API retorna 404. UI mostra mensagem. |
| Duplicata | SQL ignora, retorna `ok: true` com contagem atual. |
| .env não configurado | API retorna `env-missing`. UI degrada. |

---

## 8. Próximos passos

Com T05 entregue, a verificação comunitária está **funcional**. Próximos tijolos podem incluir:

- **T06:** Upload de foto e anexo visual ao report.
- **T07:** Dashboard de moderação com aprovação/rejeição batch.
- **T08:** Notificações de confirmação para autores.
- **T09:** Ranking de contribuidores por verificações.

---

**Fim do documento T05.**
