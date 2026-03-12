# T14b - OG Aggregates (Metadados em Telas Agregadoras)

## O que este Tijolo Faz
O T14b eleva a maturidade de compartilhamento das telas estratégicas e agregadoras do projeto (`/transparencia`, `/territorio`, `/comparativos`, `/timeline`), adicionando Social Previews (Open Graph) dinâmicos via `next/og` e tags `Metadata` de página.

## Telas Cobertas
1. **`/transparencia`**: Resumo de dados de zeladoria com métricas de relatos.
2. **`/territorio`**: Ranking e risco concentrado por bairros.
3. **`/comparativos`**: Deltas direcionais entre janelas temporais.
4. **`/timeline`**: Intensidade de publicações e hotspots no calendário.

## Estratégia Adotada e Limitações (`next/og` Edge)
Diferente das páginas por item (ex: `/alertas/[id]`), onde o ID na rota serve param buscar o dado específico e refletir integralmente a página, as rotas agregadas usam amplamente as *Query Params* (ex: `?days=30`).
No Next.js (App Router), as tags estáticas `metadata` e a rota `opengraph-image.tsx` **não recebem search params do client side** atrelados à URL exata que o usuário compartilha diretamente no momento do parse do preview em redes sociais remotas.

Por isso, aplicamos **Degrade Seguro e Compartilhamento Institucional**:
- As imagens OG carregam uma visão padrão geral (Normalmente lendo dados da janela de "30 dias" como proxy de vitalidade da plataforma).
- Elas priorizam títulos institucionais fortes e visual consistente (Core OG Theme).
- Se a chamada ao Supabase falhar (ex: Localhost sem `.env`), as OGs exibem um Empty State informativo amigável em vez de crashar a edge function.

## Integração de APP_BASE_URL
O helper `getAppBaseUrl()` é crucial para o SEO porque as tags de OG (`og:url`, `og:image`) exigem URLs absolutas bem formadas na raiz.
Se a variável faltar em Produção, a engine tentará referenciar `http://localhost:3000`, o que fará as imagens de preview falharem no Telegram/WhatsApp/Discord/Twitter.

## Próximos Passos
- **T15**: Fazer os webhooks nativos dispararem previews enriquecidos diretamente para Discord/Slack/Telegram.
- **T14c**: Estudo de Arquitetura de "Share Routes" Parametrizadas. Ex: criar um hash curto (ex: `/s/abcde`) que injeta a URL exata do Search Param num OG pré-renderizado pontual se for estritamente necessário no futuro.
