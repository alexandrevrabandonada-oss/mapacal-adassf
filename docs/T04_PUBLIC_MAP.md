# T04: Mapa Publico

## O que /mapa ja faz de verdade

- Le os registros publicados e exibe em mapa com marcadores.
- Mostra apenas `status = published`.
- Permite filtros por condicao, bairro e apenas verificados.
- Sincroniza lista lateral com selecao no mapa.
- Exibe detalhe resumido do ponto selecionado com link para `/r/[id]`.

## Regra de publicacao

- O mapa publico mostra somente registros publicados.
- Registros enviados por `/novo` entram como `pending`.
- Publicacao depende de moderacao.

## Como aplicar SQL do T04

1. Abra o SQL Editor no dashboard do Supabase.
2. Execute primeiro os scripts base:
   - `supabase/sql/T02_base_schema.sql`
   - `supabase/sql/T03_reports_and_dedupe.sql`
3. Execute `supabase/sql/T04_public_map.sql`.
4. Confirme que as RPCs existem:
   - `list_published_reports`
   - `get_published_report_by_id`

## Teste manual sugerido

1. Configure `.env.local` com URL e anon key.
2. Faça login em `/login`.
3. Crie registro em `/novo`.
4. No dashboard, altere o `status` do registro para `published`.
5. Abra `/mapa` e verifique marcador e lista.
6. Clique no item e abra `/r/[id]`.

## O que ainda falta

- Upload de foto
- Moderacao operacional completa
- Confirmar existente no fluxo publico
- Clusters / heatmap / cobertura por bairro
- Transparencia mais robusta com series historicas
