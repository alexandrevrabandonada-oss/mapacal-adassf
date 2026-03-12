# T14 - Social Previews e Open Graph Cards

## O que este Tijolo Faz
O T14 provê mecanismos nativos de SEO e Preview (WhatsApp, Telegram, Discord, X) gerando imagens Edge dinamicamente (com o pacote `next/og` - `ImageResponse`). 

Isto expande profundamente a auditabilidade e penetração cidadã do sistema, tornando cada **Snapshot**, **Diff** e **Alerta** um "Card Cidadão" facilmente compartilhável.

### 1 - O Tema Base e Utils
O OG funciona como uma sub-aplicação isolada (Server Edge) sem interações do client base.
- `lib/og/og-theme.ts`: Define a identidade da aplicação restrita à Edge.
- `lib/og/og-utils.ts`: Utilitários isolados e tipados de date-parser nativos (dispensa date-fns pesados).

### 2 - As Rotas Tratadas
O T14 construiu a indexação e o endpoint gerador de SVG para PNG nativos em:
- `/alertas/[id]/opengraph-image.tsx` -> Resumo do Alerta (Escopo e Severidade).
- `/snapshots/transparencia/[id]/opengraph-image.tsx` -> Relato numérico dos tickets.
- `/snapshots/territorio/[id]/opengraph-image.tsx` -> Onde o problema físico está focando.
- `/snapshots/diffs/[id]/opengraph-image.tsx` -> Mudanças entre snapshots.

Todas estas rotas acompanham também em sua `page.tsx` base a injeção do objeto assíncrono final `export async function generateMetadata()`.

## A Dependência de APP_BASE_URL
O SEO/OG strict depende de URLs *Absolutas* bem definidas (para inserir no property `og:image` e `<link rel="canonical">`).
Essa variável foi adicionada ao `.env.example` e ao Helper `getAppBaseUrl()` no `lib/env.ts`.

**Comportamento Secreto**: Se falhar e a Host base cair no fallback, `http://localhost:3000` é assumido mas as redes sociais externas falharão ao carregar as imagens caso não resolvam os DNS locais. Em Produção na Vercel certifique de injetar essa var.

## Limitações (Por Design Seguro)
- Fontes (WebFonts) não são carregadas externamente. Usamos "sans-serif" padrão do sistema host. Evita DeOps gigantescos corrompendo a Memory Limit do Renderizador Yoga (Sub-engina por trás do next/og).
- OGs baseados 100% num layout Server Side neutro de dependências front-end React para alta escalabilidade.

## Próximos Passos (Next Horizon)
- **T14b**: Injeção da geração Meta nos dashboards genéricos que não possuem ID indexável e precisam de queryStrings puras (`/comparativos`, `/timeline`).
- **T15**: Integração Webhook Nativo transformando as cargas do T13 numa linguagem aceita por Discord e Slack nativos.
