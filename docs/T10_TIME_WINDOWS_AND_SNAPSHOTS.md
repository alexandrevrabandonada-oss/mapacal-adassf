# T10: Filtros Temporais e Snapshots Públicos

## Objetivo

Entregar a primeira camada de **leitura temporal comparável e compartilhável**:

- Filtros temporais consistentes entre `/transparencia`, `/territorio` e `/mapa`
- Query params estáveis para snapshots públicos
- Snapshots públicos compartilháveis via link
- Exports respeitando filtros temporais
- Degradação segura sem SQL/env

## O que funciona agora

### Filtros Temporais Implementados

#### Janelas disponíveis
- **7 dias**: Ultimas 7 dias (urgências muito recentes)
- **30 dias**: Ultimos 30 dias (default, bom para planejamento mensal)
- **90 dias**: Ultimos 90 dias (tendências trimestrais)
- **365 dias**: Ultimo ano (histórico estrutural)

#### Onde funcionam
- `/transparencia?days=7|30|90|365` - Resumo, condição, bairro
- `/territorio?days=7|30|90|365` - Ranking de prioridade territorial  
- `/mapa?days=7|30|90|365` - (preparado, dados brutos ainda não filtrados por UI)
- `/snapshots/transparencia?days=7|30|90|365` - Snapshot compartilhável
- `/snapshots/territorio?days=7|30|90|365` - Snapshot compartilhável

#### Exports
- `/api/exports/reports.csv?days=7&neighborhood=XX` - Relatos em CSV
- `/api/exports/reports.geojson?days=30&neighborhood=XX` - Relatos em GeoJSON

Nomes de arquivo refletem o recorte:
- `relatos-calcadas-7d.csv`
- `relatos-calcadas-30d.geojson`

### Componentes Reutilizáveis

**`<TimeWindowTabs />`** (Client Component)
```tsx
<TimeWindowTabs basePath="/transparencia" />
```
- Mostra tabs para 7, 30, 90, 365 dias
- Preserva outros query params
- Integrado em /transparencia, /territorio, /mapa

**`<ShareSnapshotPanel />`** (Client Component)
```tsx
<ShareSnapshotPanel
  snapshotUrl="https://..."
  days={30}
  label="Transparência"
/>
```
- Mostra link consolidado
- Botão "Copiar link"
- Aviso honesto: "URL congelada, dados atuais"

### Data Layer

**`lib/filters/time-window.ts`**
- `normalizeTimeWindow()` - Valida e normaliza dias (fallback 30)
- `getTimeWindowLabel()` - Label amigável (e.g., "Ultimos 30 dias")
- `buildTimeWindowUrl()` - Monta URL preservando params
- `parseTimeWindowFromSearchParams()` - Parse do componente Page

**`lib/reports/get-transparency-summary.ts`**
```ts
getTransparencySummary(days: number, neighborhood?: string)
```
- Agora parametrizado por `days`
- Fallback seguro se env/RPC ausentes

**`lib/reports/get-transparency-breakdowns.ts`**
```ts
getTransparencyBreakdowns(days: number)
```
- Breakdown por condição filtrado por dias
- Breakdown por bairro filtrado por dias
- Timeline filtrada por dias

**`lib/reports/get-neighborhood-priority-breakdown.ts`**
```ts
getNeighborhoodPriorityBreakdown(days: number)
```
- Priority score recalculado por dias
- Padrão: 90 dias (T09), agora parametrizado

**`lib/reports/get-neighborhood-recent-alerts.ts`**
```ts
getNeighborhoodRecentAlerts(limit: number, days: number)
```
- Alertas recentes filtrados por dias
- Útil para teritorios dinâmicos

**`lib/reports/export-published-reports.ts`**
```ts
getExportPublishedReports(days: number, neighborhood?: string)
```
- CSV/GeoJSON filtrados por dias + bairro
- Sem `created_by` (privacidade)
- Sem `photo_private_path` (sigilo)

**`lib/reports/get-public-snapshot.ts`** (estrutura futura)
```ts
getPublicSnapshot(kind, days, neighborhood?)
```
- Preparado para snapshots consolidados
- Por agora: degradação segura
- Pode ser substituído por RPC dedicada T10

**`lib/reports/get-time-filtered-map-points.ts`** (estrutura preparada)
- Promete filtro temporal no mapa
- Hoje filtra em memória; SQL T10 pode otimizar

### SQL (T10_time_windows_and_snapshots.sql)

Todas as RPCs agora aceitam `in_days`:

```sql
-- Transparência
get_transparency_summary(in_days DEFAULT 30, in_neighborhood DEFAULT NULL)
get_condition_breakdown(in_days DEFAULT 30)
get_neighborhood_breakdown(in_days DEFAULT 30)
get_report_timeline(in_days DEFAULT 30)

-- Territorial
get_neighborhood_priority_breakdown(in_days DEFAULT 90)
get_neighborhood_recent_alerts(in_limit DEFAULT 20, in_days DEFAULT 90)

-- Export
get_export_published_reports(in_days DEFAULT 30, in_neighborhood DEFAULT NULL)

-- Mapa
list_published_reports_by_days(in_days DEFAULT 30)
```

Uso em TypeScript:
```ts
const { data } = await supabase.rpc("get_transparency_summary", {
  in_days: 30,
  in_neighborhood: null
});
```

### Páginas

**`app/transparencia/page.tsx`**
- Lê `searchParams.days`
- TimeWindowTabs integrado
- ShareSnapshotPanel
- ExportPanel com days
- Link para /territorio preservando days

**`app/territorio/page.tsx`**
- Lê `searchParams.days`
- TimeWindowTabs integrado
- ShareSnapshotPanel
- Links cruzados preservam days
- Score territorial varia por período

**`app/mapa/page.tsx`**
- Preparado com TimeWindowTabs UI
- Links cruzados preservam days
- Dados brutos ainda não filtrados (/api)

**`app/snapshots/transparencia/page.tsx`**
- Página leve e compartilhável
- Mostra resumo + condição + bairro
- Sem timeline pesada
- Export link preserva days
- Aviso: "Dados atuais, URL estável"

**`app/snapshots/territorio/page.tsx`**
- Página leve com ranking apenas
- Sem alertas recentes (peso reduzido)
- Links cruzados para análise completa

### Fluxo de Teste (Manual)

1. **Setup SQL no Supabase**
   ```sql
   -- SQL Editor > New Query
   -- Copie conteúdo de supabase/sql/T10_time_windows_and_snapshots.sql
   -- Run
   ```

2. **Criar/publicar dados em datas variadas**
   - Dashboard moderação: Publique alguns reports
   - Faça variar datas de criação manualmente (se possível) ou aguarde naturalmente

3. **Testar filtros**
   ```
   /transparencia?days=30
   /transparencia?days=90
   /territorio?days=7
   /territorio?days=365
   ```
   - Observe números mudar
   - Priority score muda com período

4. **Snapshots**
   ```
   /snapshots/transparencia?days=30
   /snapshots/territorio?days=90
   ```
   - Copiar link
   - Compartilhar em chat/email
   - Link funciona sem depender de estado de sessão

5. **Exports**
   ```
   /api/exports/reports.csv?days=7
   /api/exports/reports.csv?days=30&neighborhood=Bom%20Retiro
   /api/exports/reports.geojson?days=90
   ```
   - Verifica nomes: `relatos-calcadas-7d.csv`, etc
   - Abre em editor CSV ou GIS

6. **Degradação sem SQL**
   - Remova `in_days` de T10_time_windows_and_snapshots.sql
   - Pages devem mostrar "RPCs nao aplicadas"
   - UI não quebra

7. **Degradação sem env**
   - Remova `NEXT_PUBLIC_SUPABASE_URL`
   - Pages mostram "Supabase nao configurado"
   - Build não quebra

## Limites Atuais

### O que NÃO é
- **Snapshots NÃO são imutáveis**. URL `?days=30` reflete dados _atuais_ do período. Se um relato fosse escondido, o snapshot refletiria isso.
- **Sem materialização histórica**. Não congelamos dados em tabela. Snapshots são recortes reproduzíveis.
- **Sem comparação de períodos**. Não há endpoint tipo "/compare/7d-vs-30d".
- **Sem alertas automáticos por período**. Notificações futuras precisariam de triggers/jobs.

### Preparação para futuro
- Estrutura de `in_days` pronta para indexação no banco
- `get_public_snapshot()` preparada para ser materializada
- Pages modularizadas para reutilizar snapshot em cards/embeds OG

## Próximos Passos Possíveis

### T10b: Snapshots Materializados
- Tabela `public_snapshots(id, kind, days, neighborhood, data, created_at)`
- Trigger que popula snapshot toda vez que há novo publish  
- Link permanente: `/snapshots/abc123` vira histórico congelado
- API `/api/snapshots/{id}` para embed em cards OG

### T11: Deltas entre Períodos
- `/territorio/compare?from=7d&to=30d`
- "Condições pioraram em X bairros nos últimos 30 dias"
- Comparação 30d vs 90d para tendências

### T12: Timeline Visual
- Gráfico de série temporal de bairro
- "Bloqueios por semana no bairro X"
- Integração com mapa para pintar bairros por hotspot temporal

## Como Aplicar T10

### 1. Deploy do SQL (você faz, não automático)

```bash
# Supabase Dashboard > SQL Editor > New Query
# Copie tudo de supabase/sql/T10_time_windows_and_snapshots.sql
# Cole
# Clique "Run"
```

Se der erro "function already exists", é normal (idempotente). Pode rodar novamente sem problemas.

### 2. Build/Deploy Código

```bash
npm install
npm run build
npm run start
```

Build passa sem env/SQL porque:
- `getTransparencySummary()` etc degradam com reason
- Pages tratam `reason === "rpc-missing"`
- Sem crashes em lint/typecheck

### 3. Testar (já descrito acima)

## Verificação

- ✅ `lib/filters/time-window.ts` existe
- ✅ `components/filters/time-window-tabs.tsx` existe
- ✅ `components/filters/share-snapshot-panel.tsx` existe
- ✅ `lib/reports/get-public-snapshot.ts` existe
- ✅ `lib/reports/get-time-filtered-map-points.ts` existe
- ✅ `lib/reports/export-published-reports.ts` atualizado com days
- ✅ `app/transparencia/page.tsx` lê searchParams.days
- ✅ `app/territorio/page.tsx` lê searchParams.days
- ✅ `app/mapa/page.tsx` lê searchParams.days
- ✅ `app/snapshots/transparencia/page.tsx` existe
- ✅ `app/snapshots/territorio/page.tsx` existe
- ✅ `components/transparency/export-panel.tsx` atualizado
- ✅ `app/api/exports/reports.csv/route.ts` lê days
- ✅ `app/api/exports/reports.geojson/route.ts` lê days
- ✅ `supabase/sql/T10_time_windows_and_snapshots.sql` existe
- ✅ npm run lint: sem erros
- ✅ npm run typecheck: sem erros
- ✅ npm run build: sucesso
- ✅ Este doc existe

## Leitura Fria do Estado Atual

### O que virou real com T10

1. **Temporal filtering é core agora**: Não é bolinha, é structural.
2. **Snapshots são compartilháveis**: Mas não imutáveis. Isso é ok para MVP.
3. **Exports respeitam período**: Útil para pesquisa histórica filtrada.
4. **UI consistente entre páginas**: Tabs iguais em /transparencia, /territorio, /mapa.
5. **Código prepara-se para escalabilidade**: RPCs com `in_days` podem receber índices futuros.

### O que ainda é frágil

1. **Data filtering em memória no mapa**: `getTimeFilteredMapPoints()` filtra JS, não SQL. Grande volume quebra.
2. **Snapshots não são freezes**: Se relatório for despublicado, snapshot reflete mudança. Esperado, mas confunde se não explicado bem.
3. **Score temporal não documentado**: Por que 90 dias default em territorio? Pode parecer arbitrário.
4. **Sem UI de "estados passados"**: Histórico de bairro não é explorado na UI ainda.

### Dependências Críticas

- ✅ **Supabase RPC com `in_days`**: Sem T10 SQL, pages degradam com "rpc-missing"
- ✅ **Server Components**: searchParams precisa ser async, função page OK
- ✅ **Client Components**: TimeWindowTabs roda "use client"
- ✅ **Query params parsing**: normalizeTimeWindow é coração da lógica

### Riscos Remanescentes

1. **SQL quebrado**: Se T10 rodar com syntax error, RPCs ficam antigas (T09), pages perdem dias. Mitigar: testar no Supabase Editor antes.
2. **Cache**: Se edge cache params, ?days=7 vs ?days=30 pode servir mesma página. Unlikely com ISR, mas monitorar.
3. **Mobile**: Snapshots leves ajudam, mas mapa ainda carrega todos os pontos. OK para MVP.

## Histórico

- T00-T09: Setup Supabase, relatórios, verificação, moderação, fotos, transparência, territorial
- **T10**: Temporal filters + snapshots públicos (este documento)

## Contato/Dúvidas

Veja docs/BRIEFING.md para contexto do projeto. Veja docs/T08_TRANSPARENCY_EXPORTS.md para export sem temporal (antecessor).
