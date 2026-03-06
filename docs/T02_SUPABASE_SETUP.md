# T02: Supabase Base Setup

## Dependências adicionadas

```json
"@supabase/supabase-js": "^2.43.0",
"@supabase/ssr": "^0.4.0"
```

## Variáveis de ambiente

Configurar no `.env.local` (não commitar) ou no dashboard do Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon-publica
```

Obter essas chaves em [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API.

## Como aplicar o SQL

1. Acesse [Supabase SQL Editor](https://supabase.com/dashboard/project/seu-projeto/sql/new)
2. Crie uma nova query
3. Cole o conteúdo de `supabase/sql/T02_base_schema.sql`
4. Clique em "Run" ou Cmd+Enter
5. Confirme que todas as tabelas foram criadas sem erros

## O que foi criar neste tijolo

✓ Schema base: `profiles`, `sidewalk_reports`, `sidewalk_tags`, `sidewalk_report_tags`, `sidewalk_verifications`, `moderation_events`
✓ Índices para performance em geolocalização e busca
✓ Row Level Security (RLS) com políticas base
✓ Seed de tags iniciais (buraco, piso quebrado, etc)
✓ Clients para browser e server
✓ Middleware para refresh de sessão
✓ Página /login com magic link (desabilitada sem env)
✓ Rota /auth/callback para exchange de código
✓ Página /auth/error para diagnóstico

## O que fica para T03+

- Formulário completo /novo com fotos (upload em Supabase Storage)
- Backend workflow de triagem e moderação
- Dedupe baseado em distância e tags
- Notificações em email
- Dashboard de transparência com dados reais
- Autenticação OAuth (Google, etc)
- Proteção de rotas autenticadas

## Segurança

- Magic Link é método seguro sem armazenar senhas
- RLS garante que usuários só veem reports publicados ou seus próprios
- Fotos privadas ficarão em bucket separado com RLS restritiva
- Moderadores identificados por role em profiles

## Próximas etapas

1. Aplicar SQL em seu projeto Supabase
2. Rodar `npm run verify` localmente para validar integração
3. Testar: `npm run dev` → ir em /login
4. Se env está configurado, você verá formulário e poderá criar conta
5. Se env ausente, você verá card informativo (sem crash)
