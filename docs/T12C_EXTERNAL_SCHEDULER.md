# T12c: Agendador Externo (External Scheduler Bridge)

## O que T12c entrega

T12b preparou a infraestrutura de dados e scripts locais para executar os jobs de forma isolada e com anti-duplicação.
T12c adiciona a camada profissional de **execução automática e contínua**, expondo uma ponte segura para ferramentas externas.

Agora, o sistema não depende mais do administrador apertar um botão no painel ou rodar um script local. Uma ferramenta externa (Github Actions, Vercel Cron, ou o próprio agendador do Windows) pode disparar o endpoint seguro que processa todos os jobs pendentes daquele período.

## Diferenças entre os modelos de execução

1. **Job manual pelo painel**: O Administrador entra em `/admin/snapshot-jobs` e manda rodar um job específico ou todos de uma vez. A autorização é baseada no login do usuário (session cookie).
2. **Script local T12b (`tools/T12b_run_snapshot_jobs.ps1`)**: Usa a chave SUPABASE_SERVICE_ROLE_KEY localmente para bater direto no banco (PostgREST), evitando o Next.js.
3. **Endpoint de Schedulers T12c (`/api/cron/snapshot-jobs`)**: Endpoint público do Next.js validado por um segredo (token) compartilhado (`SNAPSHOT_CRON_SECRET`). É a forma correta para integrações CI/CD, já que não expõe o token administrador mestre do banco de dados, apenas um token de operação da API.

## Variáveis de Ambiente Necessárias

Para a automação externa funcionar, adicione no `.env.local` (ou painel da nuvem):

```env
APP_BASE_URL=https://sua-aplicacao.com.br
SNAPSHOT_CRON_SECRET=um-segredo-longo-e-seguro-aqui
```

Se `SNAPSHOT_CRON_SECRET` não for definido, o endpoint `/api/cron/snapshot-jobs` retorna 503 (Serviço Indisponível) para evitar acessos indesejados. Não compartilhe este segredo com o front-end.

## Como testar manualmente

1. Configure `SNAPSHOT_CRON_SECRET="teste123"` no `.env.local`.
2. Inicie a aplicação `npm run dev`.
3. Abra o Powershell e teste o Dry Run (sem executar os jobs):
   ```powershell
   pwsh -File tools/T12c_trigger_snapshot_jobs.ps1 -DryRun
   ```
4. Se quiser executar os jobs, rode sem o `-DryRun`:
   ```powershell
   pwsh -File tools/T12c_trigger_snapshot_jobs.ps1
   ```
   *Alternativamente você pode passar `-JobId "uuid-do-job"` para testar apenas um.*

## Exemplos de Integração

### 1. Cron genérico (Linux)
Para rodar todo dia à meia noite:
```bash
0 0 * * * curl -X POST https://sua-url.com/api/cron/snapshot-jobs -H "x-cron-secret: $SNAPSHOT_CRON_SECRET" -d '{}'
```

### 2. Github Actions
Use uma cron workflow e adicione a action `fjogeleit/http-request-action`:
```yaml
name: Snapshot Scheduler
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  run-snapshots:
    runs-on: ubuntu-latest
    steps:
      - name: Disparar Jobs
        run: curl -X POST ${{ secrets.APP_BASE_URL }}/api/cron/snapshot-jobs -H 'x-cron-secret: ${{ secrets.SNAPSHOT_CRON_SECRET }}'
```

## Limites Atuais

- Ainda não criamos diffs matemáticos automaticamente, o diff é manual.
- O sucesso operacional depende da ferramenta externa estar ativa (crons locais com PC desligado falham).
- Não temos Retry automático caso o endpoint da Vercel sofra timeout ou database issue no meio do processamento (embora possamos simplesmente rodar o cron 3 vezes por dia e o banco fará a anti-duplicação se já rodou!).

## Próximos Passos (T12d ou T13)

- **T12d**: Diff Automático e Publicação Pós-Snapshot.
- **T13**: Alertas e Mensageria (Notificar em painel de atividade ou email quando um bairro mudar o nível de alerta crítico).
