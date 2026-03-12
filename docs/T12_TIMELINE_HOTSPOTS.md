# T12 Timeline e Hotspots Temporais

## Objetivo

Entregar uma camada publica de leitura temporal com foco em ritmo e concentracao:

- pagina `/timeline`
- serie temporal por dia/semana
- hotspots temporais por bairro e condicao
- ponte com `/mapa`, `/territorio` e `/comparativos`
- export publico `timeline.csv`

## O que `/timeline` ja faz de verdade

- Le filtro `days` (7, 30, 90, 365) e `bucket` (`day` ou `week`).
- Mostra serie agregada de `published`, `verified` e `blocked` por bucket.
- Mostra serie por condicao ao longo do tempo.
- Mostra lista de hotspots temporais com score explicito.
- Oferece pontes para mapa, territorio, comparativos e export CSV.
- Degrada com seguranca quando env/SQL nao estao prontos.

## SQL T12

Arquivo:

- `supabase/sql/T12_timeline_hotspots.sql`

Aplicacao manual no Supabase SQL Editor:

1. Copiar o conteudo de `supabase/sql/T12_timeline_hotspots.sql`.
2. Abrir o SQL Editor no projeto Supabase.
3. Colar e executar.
4. Recarregar `/timeline`.

## Como usar

Exemplos de URL:

- `/timeline?days=30&bucket=day`
- `/timeline?days=90&bucket=week`
- `/timeline?days=90&bucket=week&neighborhood=Centro`

Export:

- `/api/exports/timeline.csv?days=90&bucket=week`
- `/api/exports/timeline.csv?days=30&bucket=day&neighborhood=Centro`

## Diferenca entre os paineis

- `timeline`: ritmo temporal e concentracao por bucket de tempo.
- `territorio`: leitura espacial por bairro e prioridade territorial.
- `comparativos`: mudanca entre periodos (taxa diaria vs baseline).
- `snapshots materializados`: estados congelados para citacao publica estavel.

## Fluxo manual de teste

1. Aplicar SQLs T02..T12 no Supabase SQL Editor.
2. Criar e publicar relatos distribuidos no tempo.
3. Abrir `/timeline?days=30&bucket=day`.
4. Abrir `/timeline?days=90&bucket=week`.
5. Navegar para `/mapa` e `/territorio` pelos CTAs.
6. Baixar `timeline.csv` via `/api/exports/timeline.csv`.

## Limites atuais

- `hotspot_score` e um indice inicial de priorizacao temporal.
- Bucket semanal melhora leitura executiva, mas perde detalhe fino.
- `neighborhood` continua textual e pode ter variacao de escrita.
- Leitura temporal nao implica causalidade.

## Proximos passos

- `T12b`: snapshots automaticos diarios/semanais.
- `T13`: alertas automaticos por bairro/condicao.
- `T14`: OG cards para links de timeline e snapshots.
