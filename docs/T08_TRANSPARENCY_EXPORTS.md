# T08: Transparência e Exportações

**Status**: ✅ VERDE  
**Objetivo**: Entregar primeira camada séria de transparência com métricas agregadas e exportações públicas.

---

## Resumo

T08 transforma `/transparencia` de um painel com placeholders em um instrumento público real de leitura e pressão:
- **Métricas agregadas** de reports (publicados, verificados, pendentes, em revisão, ocultos)
- **Breakdowns** por condição de calçada e por bairro
- **Série temporal** de atividade recente
- **Exportações públicas** em CSV e GeoJSON (apenas reports publicados)
- **Degradação segura** quando Supabase ou SQL não configurados

---

## Arquivos criados/modificados

### SQL de Métricas (supabase/sql/)

**T08_transparency_exports.sql** (criado):
- `get_transparency_summary(in_days, in_neighborhood)`: resumo agregado (published, verified, pending, needs_review, hidden)
- `get_condition_breakdown(in_days)`: distribuição de reports por condição (good/bad/blocked)
- `get_neighborhood_breakdown(in_days, in_limit)`: top bairros com contagem
- `get_timeline_data(in_days)`: série temporal diária com contagem criada vs publicada
- `export_published_reports(in_neighborhood)`: dataset para export (apenas published, sem paths privados)
- Índices para otimizar agregações (status, neighborhood, created_date)

### Data Layers (lib/reports/)

**get-transparency-summary.ts** (criado):
- `getTransparencySummary(days, neighborhood)`: busca resumo agregado
- Tipo `TransparencySummary` com 5 contadores
- Degradação: env ausente → null, RPC faltante → erro com mensagem

**get-transparency-breakdowns.ts** (criado):
- `getTransparencyBreakdowns(days)`: busca 3 breakdowns em paralelo
- Tipos: `ConditionBreakdown`, `NeighborhoodBreakdown`, `TimelineEntry`
- Combinado em `TransparencyBreakdowns`
- Degradação segura com console warnings para erros parciais

**export-published-reports.ts** (criado):
- `getExportPublishedReports(neighborhood)`: busca dados para export
- `convertReportsToCSV(reports)`: converte para CSV (headers + valores com escape de aspas)
- `convertReportsToGeoJSON(reports)`: converte para GeoJSON FeatureCollection
- Nunca exporta `photo_private_path`, apenas `has_photo` (boolean)

### API Routes (app/api/exports/)

**reports.csv/route.ts** (criado):
- GET `/api/exports/reports.csv`
- Content-Type: text/csv
- Headers: Content-Disposition para download como "relatos-calcadas.csv"
- Aceita query param `neighborhood` para filtrar

**reports.geojson/route.ts** (criado):
- GET `/api/exports/reports.geojson`
- Content-Type: application/geo+json
- Headers: Content-Disposition para download como "relatos-calcadas.geojson"
- Aceita query param `neighborhood` para filtrar

### Componentes (components/transparency/)

**summary-cards.tsx** (criado):
- Exibe 5 cards grandes com contadores (published, verified, pending, needs_review, hidden)
- Design: big typography, cores corporativas, labels explicativas

**condition-breakdown.tsx** (criado):
- Grid com barras horizontais mostrando distribuição por condição
- Published em amarelo (signal), total em cinza
- Labels: "Boa", "Ruim", "Bloqueada"

**neighborhood-breakdown.tsx** (criado):
- Lista scrollable (max-height 24rem) dos top 20 bairros
- Cada linha: bairro, total, publicados
- Otimizado para não sobrecarregar UI

**timeline-list.tsx** (criado):
- Série temporal dos últimos 30 dias
- Data, contagem enviada, contagem publicada
- Lista scrollable com barras simples

**export-panel.tsx** (criado):
- Seção com 2 botões: Download CSV e GeoJSON
- Texto explicativo sobre dados públicos
- Links diretos para `/api/exports/*`

### Página (app/transparencia/page.tsx)

**Reescrita com:**
- Server component (async) que busca dados em paralelo
- Renderização condicional por estado (env ausente, RPC faltante, sem dados, dados ok)
- Integração de todos os 5 componentes
- Seção "Sobre esses dados" explicando cada métrica
- Seção "Como participar" com links para /novo e /mapa
- Subtitle atualizado: "dados agregados de reports publicados"

### Home (app/page.tsx)

**Status atualizado:**
- "Transparência pública: ativa (métricas + export)"

---

## Fluxo de dados

### Busca de métricas

1. User visita `/transparencia`
2. Server component chama em paralelo:
   - `getTransparencySummary(30)` via RPC `get_transparency_summary`
   - `getTransparencyBreakdowns(30)` via 3 RPCs
3. Se env ausente: ambas retornam null
4. Se RPC faltante: erro com mensagem amigável
5. UI renderiza cards/listas com dados ou mensagem de erro

### Exportação de dados

1. User clica "↓ CSV" ou "↓ GeoJSON" na seção de export
2. GET `/api/exports/reports.csv` ou `/api/exports/reports.geojson`
3. API chama `getExportPublishedReports(neighborhood)` via RPC
4. Converte resultado para CSV ou GeoJSON
5. Download com filename apropriado
6. Se RPC faltante ou env ausente: erro JSON com mensagem

---

## Dados exportados (CSV e GeoJSON)

```
id
created_at
condition
neighborhood
note
lat
lng
verification_count
is_verified
has_photo
```

**O que NÃO é exportado:**
- `photo_private_path` (nunca expor path privado)
- `status` (apenas published são exportados, status não precisa)
- `created_by` (privacy)
- `accuracy_m` (opcional, pode adicionar depois)

**GeoJSON properties:**
- Todas as colunas acima (type/geometry é geospatial, properties tem dados)
- Útil para importar em QGIS, Mapbox, Leaflet, etc.

**CSV:**
- RFC 4180 compliant
- Quoted fields com escape de aspas duplas
- Boolean como "yes"/"no" (CSV-friendly)

---

## Setup instrução

### 1. Aplicar SQL

No Supabase SQL Editor, copie e cole conteúdo de `supabase/sql/T08_transparency_exports.sql`:

```sql
-- Colar todo o conteúdo de T08_transparency_exports.sql
-- Atende à idempotência: create or replace function/index if not exists
```

RPCs ficam públicas (sem RLS específica) mas retornam apenas aggregates/published:
- `get_transparency_summary`: somente counts em dados published (seguro)
- `get_condition_breakdown`: somente published (seguro)
- `get_neighborhood_breakdown`: somente published (seguro)
- `get_timeline_data`: somente published (seguro)
- `export_published_reports`: somente published (seguro)

### 2. Verificar aplicação

Após aplicar SQL, abra `/transparencia`:
- Sem dados: "Sem dados de resumo disponíveis" (normal no início)
- Com dados: resumo + cards + breakdowns + timeline

### 3. Testar export

Após criar alguns reports published, clique:
- CSV: download `relatos-calcadas.csv` (abrir em Excel, GSheets)
- GeoJSON: download `relatos-calcadas.geojson` (abrir em mapas)

---

## Degradação segura

| Cenário | Comportamento |
|---------|---------------|
| Env ausente | "Supabase não configurado" card |
| RPC faltante | "RPCs não aplicadas. Aplique T08_transparency_exports.sql" card |
| Sem dados | Empty components ou "Sem dados disponíveis" |
| DB error | "Erro ao buscar" com mensagem segura (sem stack trace) |
| Export env ausente | Error JSON com status 503 |
| Export RPC faltante | Error JSON com mensagem "Aplique T08..." + status 500 |

---

## Validações

### Server-side (data layers)

- `isSupabaseConfigured()` antes de qualquer query
- RPC error mapping: code 42883 = RPC não existe
- Try-catch com console.error (não expor ao client)
- Retorna estrutura tipada (ok/reason/message)

### API routes

- Sem database query sem env check
- Content-Type correto para download
- Content-Disposition para filename
- Error responses JSON + status adequado (503 env, 500 RPC)

### Export data

- Nunca incluir `photo_private_path`
- Somente `status = 'published'` (não pending/hidden)
- CSV com proper escaping de aspas
- GeoJSON com [lng, lat] correto (não [lat, lng])

---

## Próximos passos (fora de T08)

- **T08b**: Snapshots públicos (cada semana/mês, arquivo archive)
- **T09**: Priorização por cobertura territorial (heatmap, quadrantes, regiões)
- **T10**: Filtros temporais ricos (data picker, últimos N dias)
- **T11**: Integrações (API pública, webhooks, alertas)

---

## Limites atuais

- ⚠️ Sem cache de agregações (cada request reconstrói; OK para escala atual)
- ⚠️ Sem compressão de download (OK até ~10k reports)
- ⚠️ Sem paginação em export (full dataset toda vez)
- ⚠️ Sem filtro de data na query (sempre últimos 30 dias fixo)
- ⚠️ Sem versionamento de export (data muda entre downloads)

Esses limites são aceitáveis para MVP. Escalar depois se necessário.

---

## Testes manuais

### Setup completo

```bash
# 1. Aplicar todas as SQL T02-T08
# 2. Criar alguns reports (GET /novo, submit)
# 3. Publicar alguns (GET /admin/moderacao, "Publicar")
# 4. Confirmar alguns (GET /r/[id], "Confirmar")
# 5. Visitar /transparencia
# 6. Verificar cards com números reais
# 7. Clicar "CSV", "GeoJSON"
# 8. Abrir downloads em editor/mapa
```

### Testar degradação

```bash
# 1. Remover NEXT_PUBLIC_SUPABASE_URL do .env.local
# 2. Reload /transparencia
# 3. Deverá mostrar "Supabase não configurado"
# 4. Tentar /api/exports/reports.csv
# 5. Deverá retornar JSON error 503
```

---

## Verificação T08

Executar `pwsh tools/T08_verify.ps1`:
- ✅ 21 arquivos presentes (SQL + data layers + API + components + page + docs + script)
- ✅ npm lint exit 0
- ✅ npm typecheck exit 0
- ✅ npm build exit 0, 20 rotas (18 T07 + 2 T08)
- ✅ Relatório gerado

---

**FIM T08**
