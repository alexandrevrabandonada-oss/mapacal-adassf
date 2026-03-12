# T11 - Período Deltas & Comparativos

**Status**: ✅ Ativo  
**Objetivo**: Comparar períodos de forma honesta, medindo taxa diária, não contagem bruta.

---

## 1. O que T11 faz

T11 implementa a primeira camada completa de comparação entre períodos temporais:

✅ **Comparações honestas por taxa diária**  
- No lugar de comparar 5 publicações em 7 dias (=0.71/dia) com 20 em 30 dias (=0.67/dia)
- Evita ilusões causadas por períodos de tamanhos diferentes

✅ **Página pública `/comparativos`**  
- Resumo de deltas (published, verified, blocked)
- Deltas por condição (poor/bad/fair/good/unknown)
- Deltas por bairro (com destaque para bloqueados/verificados)
- Alertas de aceleração (top N pares bairro-condição com maior piora)
- Links para exploração em /territorio e /mapa

✅ **Query params compartilháveis**  
- `?days=7&baselineDays=30` - últimos 7 dias vs últimos 30
- `?days=30&baselineDays=90` - últimos 30 dias vs últimos 90
- `?days=90&baselineDays=365` - últimos 90 dias vs último ano

✅ **Export CSV**  
- `/api/exports/deltas.csv?days=7&baselineDays=30&type=condition`
- `/api/exports/deltas.csv?days=7&baselineDays=30&type=neighborhood`
- Dados agregados públicos, sem dados brutos pessoais

✅ **Navegação unificada**  
- Links para comparativos em /transparencia, /territorio, /mapa
- Comparativos linkam back para territorial/mapa já na janela atual
- Cada ponto de entrada leva a visualizações complementares

---

## 2. Arquitetura

### 2.1 Modelo Temporal (`lib/filters/comparison-window.ts`)

```typescript
// Janelas válidas
ALLOWED_CURRENT_WINDOWS = [7, 30, 90]  // janela "atual"
ALLOWED_BASELINE_WINDOWS = [30, 90, 365]  // janela "base"

// Interface
interface ComparisonWindow {
  currentDays: 7 | 30 | 90;
  baselineDays: 30 | 90 | 365;
}

// Helper key functions
normalizeComparisonWindow(current, baseline) → ComparisonWindow
getComparisonLabel(current, baseline) → "7 dias vs. 30 dias (baseline)"
buildComparisonUrl(baseUrl, current, baseline) → "?days=7&baselineDays=30"
parseComparisonFromSearchParams(params) → ComparisonWindow
```

**Regra importante**: baseline sempre > current. Se não for, normaliza para próxima janela maior.

### 2.2 SQL (`supabase/sql/T11_period_deltas.sql`)

4 RPCs públicas, todas parametrizadas com `in_current_days` e `in_baseline_days`:

#### RPC 1: `get_period_delta_summary`

```sql
Entrada: in_current_days, in_baseline_days, in_neighborhood(opcional)

Returns:
- current_days, baseline_days (eco)
- current_published, baseline_published (counts)
- current_per_day, baseline_per_day (taxa diária)
- published_delta_per_day, published_delta_pct (delta em taxa/%)
- current_verified, baseline_verified, verified_delta_per_day, verified_delta_pct
- current_blocked, baseline_blocked, blocked_delta_per_day, blocked_delta_pct

Regra:
- Compara apenas status='published'
- Janela atual: now() - in_current_days
- Janela base: now() - in_baseline_days a now() - in_current_days
- pct = null quando baseline_per_day = 0 (honesto)
```

#### RPC 2: `get_condition_period_deltas`

```sql
Entrada: in_current_days, in_baseline_days, in_neighborhood(opcional)

Returns: condition, current_count, baseline_count, current_per_day, baseline_per_day,
         delta_per_day, delta_pct, current_verified, baseline_verified

Ordenado por: delta_per_day DESC (maior agravamento primeiro)
```

#### RPC 3: `get_neighborhood_period_deltas`

```sql
Entrada: in_current_days, in_baseline_days

Returns: neighborhood, current_count, baseline_count, current_per_day, baseline_per_day,
         delta_per_day, delta_pct, current_blocked, baseline_blocked, 
         current_verified, baseline_verified, current_with_photo, baseline_with_photo

Ordenado por: delta_per_day DESC
```

#### RPC 4: `get_acceleration_alerts`

```sql
Entrada: in_current_days, in_baseline_days, in_limit (default 12)

Returns: neighborhood, condition, current_per_day, baseline_per_day,
         delta_per_day, delta_pct, severity_rank

Filtro: Apenas pares onde delta_per_day > 0 (agravamento)
Prioriza: Blocked/bad conditions com delta maior
Limit: Top in_limit
```

**Índices auxiliares criados**:
- `idx_reports_created_at`
- `idx_reports_neighborhood_created_at`
- `idx_reports_condition_created_at`
- `idx_reports_status_created_at`

### 2.3 Camada de Dados

4 funções Server-only em `lib/reports/`:

- `get-period-delta-summary.ts` → `getPeriodDeltaSummary()`
- `get-condition-period-deltas.ts` → `getConditionPeriodDeltas()`
- `get-neighborhood-period-deltas.ts` → `getNeighborhoodPeriodDeltas()`
- `get-acceleration-alerts.ts` → `getAccelerationAlerts()`

Cada uma:
- Degrada seguramente se env ausente
- Retorna `{ok, data, reason, message}`
- Mapeia erros RPC (42883 = RPC missing)

### 2.4 Componentes UI

**`components/filters/comparison-window-tabs.tsx`**  
- Tabs para trocar entre pares válidos (7vs30, 7vs90, 30vs90, 30vs365, 90vs365)
- Preserva params adicionais (ex: ?neighborhood=Vila+Mariana)
- Mobile-friendly

**`components/comparison/delta-summary-cards.tsx`**  
- 3 cards: published, verified, blocked
- Cada mostra: taxa atual, taxa base, delta/dia, delta %
- Quando pct=null, mostra "sem base suficiente" (honesto)

**`components/comparison/condition-delta-table.tsx`**  
- Tabela: condição, count atual/base, taxa, delta, delta%
- Ordenada por agravamento
- Cores vermelha (piora) / verde (melhora)

**`components/comparison/neighborhood-delta-table.tsx`**  
- Tabela: bairro, count atual/base, taxa, delta, delta%
- Inclui colunas: bloqueados, verificados
- Links para /territorio filtrando bairro

**`components/comparison/acceleration-alerts-list.tsx`**  
- Lista de alertas (top 12 agravamentos)
- Cada item: bairro, condição, rank de severidade
- Links para /territorio e /mapa

**`components/comparison/comparison-methodology-note.tsx`**  
- Explica de forma clara:
  - Por que "taxa por dia" e não contagem bruta
  - Por que % = null quando baseline = 0
  - Por que não é série histórica
  - Como usar junto com /territorio e /mapa

### 2.5 Página Pública (`app/comparativos/page.tsx`)

- Lê `?days=...&baselineDays=...`
- Busca dados em paralelo (summary + 3 deltas)
- Renderiza: tabs → summary → tables → alerts → metodologia → CTAs
- Degrada com segurança se SQL não aplicado

### 2.6 Export CSV (`app/api/exports/deltas.csv/route.ts`)

```
GET /api/exports/deltas.csv?days=7&baselineDays=30&type=condition

type=condition → CSV com deltas por condição
type=neighborhood → CSV com deltas por bairro
```

Sem dados pessoais; apenas agregados públicos.

---

## 3. Como Usar

### 3.1 Aplicar SQL

1. Abra Supabase SQL Editor
2. Copie o conteúdo de `supabase/sql/T11_period_deltas.sql`
3. Cole e execute
4. Verifique sucesso

Índices podem demorar em BD com muitos dados. Tudo é idempotente (seguro re-rodar).

### 3.2 Testar Manual

**Setup de teste** (criar distribuição temporal):

```sql
-- Criar 5 publicações em 7 dias
INSERT INTO sidewalk_reports(created_by, condition, lat, lng, status)
SELECT 
  'test-user',
  ARRAY['poor','bad','fair','good'][(random()*3)::int + 1],
  -23.55 + random()*0.1,
  -46.65 + random()*0.1,
  'published'
FROM generate_series(1,5);

-- Esperar 7 dias ou ajustar created_at
UPDATE sidewalk_reports SET created_at = now() - interval '8 days' 
WHERE id IN (SELECT id FROM sidewalk_reports ORDER BY created_at DESC LIMIT 5);

-- Agora teremos: 5 relatos em últimos 8+ dias (diferentes de últimos 7)
```

**URLs de teste**:

```
/comparativos?days=7&baselineDays=30
  → Últimos 7 vs últimos 30 dias

/comparativos?days=30&baselineDays=90
  → Últimos 30 vs últimos 90 dias

/comparativos?days=90&baselineDays=365
  → Últimos 90 vs último ano

/api/exports/deltas.csv?days=7&baselineDays=30&type=condition
  → Download CSV de deltas por condição

/api/exports/deltas.csv?days=30&baselineDays=90&type=neighborhood
  → Download CSV de deltas por bairro
```

### 3.3 Interpretação

- **Delta positivo** = mais publicações/dia agora → ⚠️ piora
- **Delta negativo** = menos publicações/dia agora → ✅ melhora
- **Delta % = null** = baseline zero → sem comparação confiável
- **Severity rank** = ordem de prioridade (1 = pior agravamento)

---

## 4. Boas Práticas

### ✅ Usar comparativos para:

- Identificar onde agravamento é mais rápido
- Priorizar incidência territorial
- Validar impacto de mutirões/campanhas
- Contextualizar snapshots com tendência

### ❌ Não usar para:

- Previsão estatística formal (usaria modelo time-series)
- Causalidade (causa versus correlação)
- Análise de efetividade de política (precisa design experimental)

---

## 5. Limites Atuais

⚠️ **Janelas móveis, não snapshots**  
- A linha-base muda a cada dia
- Um comparativo "congelado" de ontem já não é reproduzível hoje
- Solução futura: T11b com snapshot materializado

⚠️ **Sem contexto histórico completo**  
- Comparamos apenas 2 períodos, não série em sete janelas
- Solução futura: T12 com timeline visual

⚠️ **Taxa diária é agregado, não causalidade**  
- Agravamento pode ser bairro entrando (cobertura), não pior condição
- Sempre validar com /territorio e /mapa

---

## 6. Próximos Passos Possíveis

### T11b: Snapshots Materializados

```sql
CREATE TABLE snapshot_deltas (
  id uuid,
  taken_at timestamp,
  current_days int,
  baseline_days int,
  summary jsonb,
  deltas_by_condition jsonb,
  deltas_by_neighborhood jsonb,
  alerts jsonb
);
```

- Congelaria estado exato do comparativo em ponto no tempo
- Linkaria com /snapshots para "compartilhamento imutável"
- Permitiria diffs entre snapshots ("desde semana passada")

### T12: Timeline & Hotspots

- Gráfico: eixo X = tempo, eixo Y = taxa de publicação
- Aplicar a cada bairro e/ou condição
- Destacar "hotspots" de agravamento
- Integrar com /mapa para visualização geográfica temporal

### T13: Alertas Automáticos

- Monitorar diariamente se agravamento supera limiares
- Enviar notificação para comunidade afetada
- Propor resposta recomendada (mutirão, etc)

---

## 7. Verificação

Após aplicar T11_period_deltas.sql, verifique:

```sql
-- Testar RPC 1
SELECT * FROM get_period_delta_summary(7, 30);

-- Testar RPC 2
SELECT * FROM get_condition_period_deltas(7, 30);

-- Testar RPC 3
SELECT * FROM get_neighborhood_period_deltas(7, 30);

-- Testar RPC 4
SELECT * FROM get_acceleration_alerts(7, 30, 12);
```

Todas devem retornar rows mesmo com BD vazia (com zeros nas contagens).

---

## 8. Integração com Projeto

### Páginas atualizadas com links:
- `/transparencia` → "Comparação entre períodos"
- `/territorio` → "Ver comparação de períodos"
- `/mapa` → "Abrir comparativos"

### Nova página:
- `/comparativos` → Painel completo

### Nova rota API:
- `GET /api/exports/deltas.csv` → CSV público

### Tipos novos:
- `ComparisonWindow`, `PeriodDeltaSummary`, `ConditionPeriodDelta`, etc.

### Componentes novos:
- 6 componentes em `components/comparison/`

---

## 9. Metodologia em Detalhes

### Por que taxa diária?

Cenário:
- Período A: 7 dias, 10 publicações = 1.43/dia
- Período B: 30 dias, 35 publicações = 1.17/dia

Leitura errada: "35 > 10, portanto piorou"  
Leitura correta: "1.43 > 1.17, o período curto é mais intenso"

Taxa diária normaliza o tamanho dos períodos. Evita ilusão.

### Por que % é null quando baseline = 0?

Cenário:
- Baseline: 0 publicações = 0/dia
- Atual: 5 publicações = 5/dia
- Delta %: (5 - 0) / 0 = ∞ (impossível)

Mostrar "∞" ou "muito agravado" seria desonesto sem contexto.  
Mostrar "—" (vazio) é honesto: "não temos baseline para comparar".

---

## 10. Troubleshooting

### Comparativos sempre vazio

- SQL T11_period_deltas.sql não foi rodado
- Verifique: `SELECT get_period_delta_summary(7, 30)` no SQL Editor
- Se erro 42883, RPC não existe

### Números muito diferentes de /transparencia

- `/transparencia` pode usar filtro por neighborhood
- `/comparativos` usa toda a cidade por padrão
- Adicione `?neighborhood=X` se necessário

### Performance lenta em BD grande

- Índices foram criados. Se ainda lento:
  - Considere refresh de materialização
  - Ou particionar tabela sidewalk_reports por mês/trimestre

---

## 11. Referência Rápida

| Endpoint | Localização | Função |
|----------|-----------|--------|
| `/comparativos` | app/comparativos/page.tsx | Painel público |
| `/api/exports/deltas.csv` | app/api/exports/deltas.csv/route.ts | Export público |
| getPeriodDeltaSummary() | lib/reports/get-period-delta-summary.ts | RPC 1 |
| getConditionPeriodDeltas() | lib/reports/get-condition-period-deltas.ts | RPC 2 |
| getNeighborhoodPeriodDeltas() | lib/reports/get-neighborhood-period-deltas.ts | RPC 3 |
| getAccelerationAlerts() | lib/reports/get-acceleration-alerts.ts | RPC 4 |
| ComparisonWindowTabs | components/filters/comparison-window-tabs.tsx | UI |
| DeltaSummaryCards | components/comparison/delta-summary-cards.tsx | UI |
| ConditionDeltaTable | components/comparison/condition-delta-table.tsx | UI |

---

**Última atualização**: 2026-03-09  
**Próxima revisão**: Após T11b ou T12
