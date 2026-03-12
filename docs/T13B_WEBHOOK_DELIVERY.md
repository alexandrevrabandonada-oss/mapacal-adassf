# T13b - Entrega de Webhooks (Delivery)

## Visão Geral
O sistema T13b complementa o T13 (Geração de Alertas) criando a **ponte final de saída** dos dados. Ele varre os alertas criados e os despacha ativamente para integrações como n8n, Zapier, ferramentas customizadas, Discord, Slack ou Telegram usando fluxos Webhook simples.

A função é atuar como "Dispatcher", evitando spam com a regra de deduplicação agressiva: um alerta não é reenviado para um mesmo destino caso já exista uma entrega com statusCode `2xx`.

## Componentes Técnicos
1. **Modelagem de Dados** (`T13b_webhooks.sql`):
   - `alert_webhook_destinations`: Cadastros de destinos (URL habilitadas + Filtros de evento).
   - `alert_delivery_runs`: Metajobs (logs consolidados) da expedição.
   - `alert_deliveries`: Cada envio individual registrado. O "response body" é podado para evitar estouro da base de dados.

2. **Backend**:
   - `app/api/admin/alerts/deliver/route.ts` - Requisições UI / Admin manuais.
   - `app/api/cron/alerts/deliver/route.ts` - Requisições para ferramentas Cron Externas via Header Auth.

3. **Orquestrador**:
   - `deliver-alerts-to-webhooks.ts`: Função server side pesada que: (1) varre os alertas abertos, (2) ignora os filtrados, (3) usa Partial Unique Index para dedupe forte em tabela SQL transacionalmente segura, limitando duplicações em `race conditions`, e (4) efetua as solicitações POST REST.

## Testando Manualmente
1. Acesse o **SQL Editor** do Supabase local e aplique o script `T13b_webhooks.sql`.
2. Habilite o Seed do "logger" padrão na UI local manipulando com SQL INSERT, ou simule o "Test Dry Run" no Painel UI (`/admin/alertas`).
3. Dispare uma vez e analise as respostas no Histórico de Eventos. Você notará que alertas antigos que já receberam 'success' serão Skipped (Deduped).

## Limites e Next Steps
- **Não há Retry Complexo (Exponential Backoff)**: Se a entrega falhar por network, a flag continua lá e o operador pode ativamente re-enviar, mas um "daemon auto retry" não existe ainda.
- Não processamos e-mails formatados e templates, focamos em raw data. O parsing em UI Graph fica a cargo do receptor (e.g n8n). Se necessário, **T14** pode trazer templates OG/Card de export.
