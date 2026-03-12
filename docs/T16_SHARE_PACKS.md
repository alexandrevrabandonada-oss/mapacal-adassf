# T16 - Share Packs Público

Este documento descreve o sistema de pacotes de compartilhamento ("Share Packs") implementado para facilitar a circulação de dados públicos do Mapa de Calçadas SF.

## O que é o Share Pack?

Um Share Pack é um conjunto de informações preparadas para circulação social rápida, composto por:
1.  **Título**: Identificação clara da entidade (Alerta, Snapshot ou Diff).
2.  **Texto Pronto**: Mensagem formatada com emojis para WhatsApp/Telegram.
3.  **Link Canônico**: URL pública absoluta apontando para o item.
4.  **Imagem de Preview**: URL da imagem Open Graph (OG) gerada dinamicamente.

## Entidades Suportadas

- **Alertas**: Resumo de severidade, bairro e link direto.
- **Snapshots de Transparência**: Dados agregados de publicações e verificações.
- **Snapshots de Território**: Foco em prioridades de bairros.
- **Diferenciais (Diffs)**: Foco no impacto e direção das mudanças (melhora/piora).

## Arquitetura de Dados

O backend reside em `lib/share/` e segue o fluxo:
1.  **Resolvers**: `get-*-share-data.ts` buscam dados mínimos necessários via RPCs.
2.  **Builders**: `build-*-share-pack.ts` aplicam lógica de formatação e constroem links absolutos.
3.  **API Context**: Rotas em `/api/share/...` fornecem JSON para o cliente.

## Componentes de UI

Localizados em `components/share/`:
- `SharePackDrawer`: O ponto de entrada visual (Drawer/Modal).
- `SharePackPreview`: Card que mostra ao usuário como o link aparecerá.
- `ShareActions`: Grid de botões (Copiar Link, WhatsApp, Copiar Texto).

## Configuração (APP_BASE_URL)

O sistema depende da variável `APP_BASE_URL` para gerar links absolutos funcionais.
- **Produção**: Deve ser o domínio real (ex: `https://mapa.sf.gov.br`).
- **Verificação**: `lib/env.ts` fornece fallback para `localhost:3000`.

## Limites Atuais

- **Web Share API**: Não é utilizada para maximizar compatibilidade em browsers desktop sem suporte a share nativo.
- **Imagens**: Reaproveita as rotas OG existentes em vez de gerar novos buffers binários.
- **Timeline**: Ainda não possui share pack dedicado (planejado para T16b).

## Próximos Passos
- **T17**: Templates por canal (Twitter/X, Threads, Instagram Link).
- **T18**: Geração de Cards 1:1 para download direto.
