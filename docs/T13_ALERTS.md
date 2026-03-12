# T13 - Alertas Automáticos

## Visão Geral
O sistema de **Alertas Automáticos** resolve a última lacuna de automação: transformar observações estáticas e métricas em **sinais acionáveis**. Em vez de exigir que a prefeitura abra a visualização de territórios todos os dias buscando o que piorou, o sistema agora faz isso ativamente.

As regras procuram picos em problemas ou volume acima da média (ex: bairros com crescimento anormal de relatos) e cravam alertas de forma assíncrona para guiar manutenções e auditorias operacionais corretivas.

## Diagrama da Automação

1. Job Executa ou usuário clica em Avaliar.
2. Call para `evaluate_alert_rules` com dias base.
3. RPC avalia as regras habilitadas (`general_acceleration`, `neighborhood_blocked_acceleration`, `condition_bad_spike`).
4. RPC usa os Deltas e Rankers internamente para decidir se cruza os limiares.
5. Se cruzar, insere em `alert_events` com uma `dedupe_key` (não clona alerta para não gerar spam de tela pro operador).
6. O Log da execução fica guardado na `alert_runs`.
7. O Admin gerencia as tratativas (`acknowledged` e `dismissed`), liberando a fila original para eventuais novas reativações do mesmo dedup key no futuro.

## Componentes Técnicos

1. **SQL / Database (`T13_alerts.sql`)**
   - Tabela `alert_rules` (regras configuráveis com payload jsonb).
   - Tabela `alert_events` (instâncias de atenção geradas, dedup parciais abertos).
   - Tabela `alert_runs` (logs das auditorias).
   - RPC `evaluate_alert_rules`: O cérebro que varre a cidade nas dimensões do T11 e T12.
   - RPC `update_alert_event_status`: Workflow do moderador.

2. **Endpoints da API**
   - `POST /api/admin/alerts/evaluate`: Avalia sob demanda ou via ServiceRole (para Jobs ou Shell).
   - `POST /api/admin/alerts/status`: Para reconhecer/ignorar os alertas. 

3. **Painel Admin (`/admin/alertas`)**
   - Painel de monitoramento que separa fila de Entrada ("Abertos") de Históricos Fechados.
   - Permite forçar corrida do Job fora da hora.

4. **Página Pública (`/alertas`)**
   - Fila viva de anomalias detectadas que também mostram total transparência à população que reportou algo fora do comum.
   - Ligação recíproca a Comparativos e Timeline.

## Integridade ao Contexto Urbano
Esta automação obedece a premissa de que a plataforma **não vende causalidade cega**. Alertar "aceleração enorme em calçadas bloqueadas" indica que há mobilização concentrada no bairro, não obriga a crer que tudo foi feito ontem. Como explicado na *Metodologia Pública*: O alerta **aponta o foco** em meio a dezenas de milhares de logs espalhados na cidade para quem faz priorizações, otimizando o envio de turmas de ação.

## Script de Validação Local
O `T13_verify.ps1` é recomendado para assegurar que as dependências Types e Pages estão construindo nativamente. Se falhar, analise os Tipos do `.ts` vs schema real.
