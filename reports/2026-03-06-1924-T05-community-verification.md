# T05 Community Verification - Relatorio de Verificacao
**Data:** 2026-03-06 19:25:37

## Resumo

T05 entrega **verificacao comunitaria**: usuarios autenticados confirmam pontos publicados, prevenindo duplicatas e fortalecendo priorizacao social.

---

## Arquivos criados/modificados

### SQL
- \supabase/sql/T05_verifications.sql\: RPC confirm_sidewalk_report + RLS para sidewalk_verifications

### Data layer
- \lib/reports/confirm-report.ts\: confirmSidewalkReport() server-only com tratamento de erros

### API
- \pp/api/reports/confirm/route.ts\: POST handler para confirmacao via /api/reports/confirm

### UI
- \components/reports/confirm-report-button.tsx\: client component com botao de confirmacao
- \pp/r/[id]/page.tsx\: integra ConfirmReportButton na pagina de detalhe
- \pp/mapa/page.tsx\: status card atualizado para "T05 ativo" + "Verificacao comunitaria: ativa"
- \pp/novo/page.tsx\: nearby list com link "Ver detalhes e confirmar"

### Types
- \	ypes/database.ts\: assinatura do RPC confirm_sidewalk_report

### Docs
- \docs/T05_COMMUNITY_VERIFICATION.md\: documentacao completa do fluxo

---

## Checklist de arquivos

- OK: `supabase\sql\T05_verifications.sql`
- OK: `lib\reports\confirm-report.ts`
- OK: `app\api\reports\confirm\route.ts`
- OK: `components\reports\confirm-report-button.tsx`
- OK: `docs\T05_COMMUNITY_VERIFICATION.md`
- OK: `tools\T05_verify.ps1`

---

## Lint

**Exit code:** 0

```

> mapa-calcadas-sf@0.1.0 lint
> eslint . --max-warnings=0


```

---

## Typecheck

**Exit code:** 0

```

> mapa-calcadas-sf@0.1.0 typecheck
> tsc --noEmit


```

---

## Build

**Exit code:** 0

```

> mapa-calcadas-sf@0.1.0 build
> next build

   Ôû▓ Next.js 15.5.12

   Creating an optimized production build ...
 Ô£ô Compiled successfully in 4.5s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/15) ...
   Generating static pages (3/15) 
   Generating static pages (7/15) 
   Generating static pages (11/15) 
 Ô£ô Generating static pages (15/15)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
Ôöî Ôùï /                                      163 B         106 kB
Ôö£ Ôùï /_not-found                            992 B         103 kB
Ôö£ Ôùï /admin/moderacao                       164 B         106 kB
Ôö£ ãÆ /api/reports/confirm                   133 B         102 kB
Ôö£ ãÆ /api/reports/create                    133 B         102 kB
Ôö£ ãÆ /api/reports/nearby                    133 B         102 kB
Ôö£ ãÆ /auth/callback                         133 B         102 kB
Ôö£ ãÆ /auth/error                            163 B         106 kB
Ôö£ Ôùï /login                               2.15 kB         162 kB
Ôö£ Ôùï /manifest.webmanifest                  133 B         102 kB
Ôö£ Ôùï /mapa                                 1.4 kB         107 kB
Ôö£ Ôùï /novo                                4.31 kB         164 kB
Ôö£ ãÆ /r/[id]                                918 B         107 kB
Ôöö Ôùï /transparencia                         164 B         106 kB
+ First Load JS shared by all             102 kB
  Ôö£ chunks/255-ebd51be49873d76c.js         46 kB
  Ôö£ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  Ôöö other shared chunks (total)          2.05 kB


ãÆ Middleware                             85.1 kB

Ôùï  (Static)   prerendered as static content
ãÆ  (Dynamic)  server-rendered on demand


```

---

## Conclusao

**STATUS: ✅ VERDE — T05 pronto para uso.**

---

**Proximos passos:**

1. Aplicar \supabase/sql/T05_verifications.sql\ no Supabase SQL Editor.
2. Garantir que ao menos 1 ponto esteja com \status = 'published'\.
3. Testar fluxo:
   - Acessar \/r/{id}\ autenticado.
   - Clicar "Confirmar este ponto".
   - Verificar contagem aumentando e badge "Verificado pela comunidade" aparecendo apos >= 2 confirmacoes.
4. Testar nearby em \/novo\: verificar link "Ver detalhes e confirmar" para cada ponto proximo.

---

**Fim do relatorio T05.**
