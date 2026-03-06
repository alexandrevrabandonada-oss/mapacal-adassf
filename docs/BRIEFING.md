# BRIEFING v1 — Mapa de Calçadas do Sul Fluminense (PWA)

## Missão
Criar uma plataforma coletiva de prova pública e cuidado urbano: foto + localização + condição das calçadas, com verificação comunitária, transparência e export de dados.

## Princípios
- Sem likes: só ações úteis (Confirmar, Replicar, Compartilhar, Revisar/Reportar).
- Privacidade por padrão (autor como “Morador(a)”).
- Acessibilidade first (alto contraste, UX simples, foco em mobilidade).
- Dados exportáveis (CSV/GeoJSON).
- Verificação comunitária (>=2 confirmações = Verificado).

## MVP
### Entidade central: Report (ponto)
- Foto (storage privado) + signed URL quando published
- GPS (lat/lng) + opcional accuracy
- Condição: passável | ruim | inacessível
- Tags (checkbox)
- Bairro
- Status: pending | published | hidden

### Rotas
- / (manifesto + CTA)
- /mapa (pins/clusters + filtros)
- /novo (envio 30–45s + dedupe)
- /r/[id] (detalhe + confirmar/reportar/compartilhar)
- /transparencia (stats)
- /admin/moderacao (fila)

## Mecânicas
- Dedupe por raio: sugerir confirmar existente.
- Selo Verificado: published + >=2 confirmações.
- Guardrails: rate limit + flag por accuracy alta.
- Moderação leve com log.

## Stack
- Next.js (App Router) + TS strict + Tailwind
- MapLibre GL + tiles OSM (atribuição obrigatória)
- Supabase (Auth, Postgres+PostGIS, Storage privado, RLS, Edge Functions)
- Vercel (deploy) + GitHub (repo)

## Banco (tabelas mínimas)
- profiles, sidewalk_reports, sidewalk_tags, sidewalk_report_tags, sidewalk_verifications, moderation_events

## Roadmap em tijolos
- T00 bootstrap + docs + tools + report
- T01 scaffold Next PWA + rotas base + verify
- T02 supabase schema + RLS + auth
- T03 /novo + upload + dedupe
- T04 /mapa + filtros + clusters
- T05 /r/[id] + verificações + selo
- T06 moderação + signed photo endpoint
- T07 transparência + export
- T08 hardening + CI + deploy