# T12d - Auto-Diffs

## Visão Geral
O sistema de **Auto-Diff** automatiza a comparações de memória em segundo plano após a geração de um Snapshot público. Sempre que um *Snapshot* (Território ou Transparência) for gerado com sucesso, o sistema procurará o último Snapshot compatível (mesmo tipo e parâmetros) e gerará um "Diff" (diferença) entre ambos, se não houver um pré-existente.

Isso elimina o último vazio automatizável do processo, conectando `Jobs Diários -> Novo Snapshot -> Automático -> Novo Diff`.

## Diagrama da Automação

1. Job Executa (ou Usuário cria manualmente via Admin)
2. Snapshot é materializado e ganha um ID.
3. Call para `create_auto_diff_for_snapshot` passando o ID do novo snapshot.
4. RPC encontra o anterior válido. Se achar, gera diff, vincula os Snapshot A e Snapshot B.
5. Se não achar, finaliza com status `skipped`.

## Componentes Técnicos

1. **SQL / Database (`T12d_auto_diffs.sql`)**
   - Tabela `snapshot_diff_runs` (id, snapshot_id, previous_snapshot_id, diff_id, status)
   - Permissões em nível de Roles (apenas Moderadores/Admin e System Service Role)
   - RPC `find_previous_compatible_snapshot`: encontra vizinho mais próximo com matching attributes.
   - RPC `create_auto_diff_for_snapshot`: cria a execução, previne duplicações, chama `create_public_snapshot_diff`.
   - RPC `list_snapshot_diff_runs`: para o painel Admin e monitoria.

2. **Tipos e Camada de Dados (Next.js)**
   - Tipos compartilhados em `lib/snapshots/auto-diff-types.ts`
   - Wrapper callers em `lib/snapshots/create-auto-diff-for-snapshot.ts`

3. **Endpoints da API**
   - `POST /api/admin/snapshots/auto-diff`: Rota segura para invocação manual pelo painel e script CLI (lê Session ou Service Role via Headers).
   - `GET /api/admin/snapshots/diff-runs`: Fornece a listagem de auditoria para o painel de admins.

4. **Painel Admin (`/admin/snapshots`)**
   - Em cada snapshot, exibe visual se ele já possui diff associado.
   - Botão para tentar o trigger de Auto-Diff manualmente caso tenha falhado.
   - Tabela de "Histórico Auto-Diff" listando todas as execuções, sucessos ou erros, com link para a UI gerada.

5. **Páginas Públicas**
   - Na página de **Snapshot**: Sessão `Comparações Relacionadas` exibe links interativos para os diffs caso eles tenham sido a Origem (A) ou Destino (B) daquela operação.
   - Na página do **Diff**: `Snapshot A (De)` e `Snapshot B (Para)` provêm links dinâmicos para a página detalhada daquele snapshot em si, gerando malha navegável sem edição de UI.

## Script de Operação e Diagnóstico
`tools/T12d_run_auto_diff.ps1 -SnapshotId "uuid-do-snapshot"`
Pode ser rodado via CLI injetando a AuthKey mestra caso for necessário corrigir massivamente no Serverless sem interface gráfica.
