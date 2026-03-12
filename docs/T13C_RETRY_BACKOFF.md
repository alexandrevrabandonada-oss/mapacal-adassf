# T13c - Retry / Backoff para Webhooks

## Resumo Tecnico
O T13c adiciona uma camada nativa de tolerância a falhas para entregas Webhook, sem incorrer no anti-pattern de filas distribuidas complexas em um app majoritariamente PULL. 

Baseia-se em tabelas e SQL Functions embutidas no Supabase, que garantem cálculos limpos de intervalos de Retry. 

## Como Aplicar
1. Va ao SQL Editor do Supabase local (ou remoto).
2. Execute o conteúdo de `T13c_delivery_retry.sql`.
3. Isso fará um upgrade imediato da tabela `alert_deliveries` gerada no **T13b**.

## Política de Tratamento

### Retentável vs Permanente
Durante o dispatch original (em `deliver-alerts-to-webhooks`), inspecionamos o HTTP Status numérico: 
- `4xx` (exceto 429 Throttle) indicam bad requests duradouros como `401 Unauthorized` ou `400 Malformed Payload`. Logo esses erros recebem o `final_status` = `failed_permanent`. Eles **NÂO ENTRARÃO** na lista de Retry.
- `Timeout`, Rede Indisponível (Exception) e `5xx`, por sua vez, recebem `final_status` = `failed_retryable`.

### Limites (Policy Local)
Os parâmetros de espera (Backoff) e do limite maximo estão definidos na tabela `alert_delivery_policy`:
- Tentativa 1 (novo erro): Espera de 5 Minutos (Base line)
- Tentativa 2: Espera de 30 Minutos.
- Tentativa 3: Espera de 6 Horas.

Ao ultrapassar as tentativas do array, o sistema usará a última configuração disponível como fallback ou se o `max_attempts` total esbarrar, converterá a entrega em `failed_permanent`.

## Funcionalidades em Interface
Administradores têm acesso a uma fila de Retentativas pendentes na sua própria interface de `/admin/alertas`. De lá é possível inspecionar visualmente qual URL está travando o sistema e efetuar disparo cirúrgico ou em lote.

Também abrimos Endpoint:
`POST /api/cron/alerts/retry` que deve ser chamado periodicamente no agendador externo (mesmo processo do T13b) usando a Secret Key. Isso garante que a retentativa corra em Background invisível.

## Próximos Passos
T13d - Integrar assinatura HMAC.
