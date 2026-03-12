# T15 - Destinos Nativos (Slack, Discord, Telegram)

Este documento descreve a arquitetura para envio transparente de Alertas da Plataforma Mapa de Calçadas para destinos nativos de comunidade: Slack, Discord e Telegram.

## O que o T15 e T15b já fazem

- **Motor de Alertas**: Suporte a `destination_type` e payloads especializados.
- **Enriquecimento Visual (T15b)**: 
  - **Fotos Automáticas**: O sistema busca a foto mais recente do relato ou bairro afetado para ilustrar o alerta.
  - **Signed URLs**: Gera links temporários seguros (24h) para fotos privadas do Supabase Storage.
- **Segurança de Secrets**: RPC `list_alert_destinations` mascara tokens sensíveis (ex: botToken) no Painel Admin.
- **Retries**: Suporte a retry com backoff exponencial (herdado de T13c).

## Canais Suportados

### `slack_webhook` (Rich)
- Utiliza **Block Kit APIs**.
- Inclui cabeçalhos coloridos por severidade (🔴, 🟠, 🔵).
- Exibe imagens (fotos dos relatos) integradas nos blocos.
- Botão "Ver Detalhes" para transição rápida ao portal.

### `discord_webhook` (Rich)
- Utiliza **Embeds** do Discord.
- Cores de borda dinâmicas por severidade.
- Foto representativa exibida como `image` no embed.
- Campos estruturados (`Fields`) para Escopo, Bairro e Severidade.

### `telegram_bot` (Rich)
- Integração direta via Telegram Bot API.
- **Entrega Híbrida**: Alterna entre `sendMessage` (apenas texto) e `sendPhoto` (foto com legenda) conforme disponibilidade de evidência visual.
- Escapamento de HTML seguro para evitar quebras em mensagens com caracteres especiais.

## Como configurar no Supabase SQL Editor

Aplique o arquivo: `supabase/sql/T15_native_destinations.sql`. Ele roda `ALTER TABLE` seguros e idempotentes na tabela existente.

### Testando manualmente

Gere um teste cadastrando seu bot id manualmente:
```sql
INSERT INTO public.alert_webhook_destinations (slug, title, destination_type, destination_config)
VALUES (
  'telegram-dev-team', 
  'Alertas Críticos Telegram', 
  'telegram_bot', 
  '{"botToken": "SEU_TOKEN:XXX", "chatId": "-100YOURCHAT"}'
);
```
Em seguida, dispare os alertas manualmente pelo Painel Admin -> Entrega Externa.

## Limites e Considerações

- **Generic Webhooks**: HMAC Signing do T13d agora é restrito apenas a `generic_webhook` para evitar conflitos com proxies do Telegram/Slack.
- **Signed URLs**: A validade das URLs assinadas é de 24 horas. Se o alerta for guardado para leitura muito posterior, a imagem pode expirar (o link do portal continua válido).
- **Rate Limit**: O orquestrador respeita os retries, mas rajadas extremas de alertas podem sofrer rate limit das APIs de destino.

## Próximos Passos
- **T16**: Share Packs - Permissão nativa via mobile e share link para compartilhamento Whatsapp/Email via clipboard de device nativo.
