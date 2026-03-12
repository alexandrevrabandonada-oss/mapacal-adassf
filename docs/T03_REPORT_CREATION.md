# T03: Report Creation em /novo

## O que ja funciona

- `/novo` agora tem formulario real para criar report com `status = pending`.
- O fluxo contempla: condicao, bairro, nota, tags, latitude, longitude e accuracy.
- Geolocalizacao opcional por navegador com fallback manual.
- Busca de pontos proximos (dedupe inicial) via RPC `nearby_sidewalk_reports`.
- Envio real para `sidewalk_reports` e vinculacao opcional em `sidewalk_report_tags`.
- UX separa estados de ambiente ausente, usuario anonimo e usuario autenticado.

## Dependencias de banco (obrigatorias)

Aplique no SQL Editor do Supabase, nesta ordem:

1. `supabase/sql/T02_base_schema.sql`
2. `supabase/sql/T03_reports_and_dedupe.sql`

Sem esses scripts aplicados, a UI nao quebra, mas exibira mensagens explicitas de indisponibilidade de banco/RPC.

## O que ainda falta para fluxo completo

- Upload privado/publico de foto (fica para proximo tijolo)
- Confirmacao comunitaria de ponto existente
- Moderacao com painel operacional completo
- Mapa real com listagem publicada e clusters

## Por que foto ficou para depois

- O objetivo do T03 e estabilizar o fluxo textual transacional (auth, validacao, insert, dedupe).
- Adicionar upload agora aumentaria superficie de erro (storage, politicas, caminhos public/private, reconciliacao de falhas).
- Com o fluxo base validado, o proximo tijolo pode focar apenas em storage e UX de anexo.

## Smoke manual sugerido

1. Configurar `.env.local` com URL e key anon do Supabase.
2. Rodar app e abrir `/login` para autenticar via magic link.
3. Ir em `/novo` e testar botao `Usar minha localizacao`.
4. Testar `Buscar pontos proximos`.
5. Enviar registro com condicao + lat/lng.
6. Conferir no Supabase Dashboard se entrou em `sidewalk_reports` com `pending`.
7. Conferir relacao em `sidewalk_report_tags` quando tags forem marcadas.
