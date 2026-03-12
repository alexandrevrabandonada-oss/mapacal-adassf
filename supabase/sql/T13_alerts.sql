-- T13_alerts.sql
-- Adiciona automacao de alertas operacionais baseados em regras pre-definidas

-- 1) Tabela de regras de alerta (alert_rules)
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  scope text not null check (scope in ('neighborhood', 'condition', 'global')),
  is_enabled boolean not null default true,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.alert_rules enable row level security;
create policy "Admins e moderators podem gerenciar alert_rules"
  on public.alert_rules for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));

-- Seeds de regras iniciais
insert into public.alert_rules (slug, title, description, scope, severity, config)
values
  (
    'neighborhood_blocked_acceleration',
    'Aceleração de bloqueios em bairro',
    'Bairros com crescimento anormal de relatos de calçada bloqueada/intransitável recentemente.',
    'neighborhood',
    'high',
    '{"min_current_per_day": 0.5, "min_delta_per_day": 0.2, "target_condition": "blocked"}'
  ),
  (
    'condition_bad_spike',
    'Pico de problemas crônicos (Bad)',
    'Condições marcadas como "ruim" (buracos, soltas) crescendo mais rápido que a linha de base.',
    'condition',
    'medium',
    '{"min_current_per_day": 1.0, "min_delta_per_day": 0.5, "target_group": "bad"}'
  ),
  (
    'general_acceleration',
    'Aceleração Geral de Relatos',
    'Bairros ou Condições que entraram no Top 5 de aceleração.',
    'global',
    'high',
    '{"min_rank": 5, "min_delta_per_day": 0.5}'
  )
on conflict (slug) do nothing;

-- 2) Tabela de eventos de alerta (alert_events)
create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.alert_rules(id) on delete cascade,
  scope text not null check (scope in ('neighborhood', 'condition', 'global')),
  neighborhood text,
  condition text,
  severity text not null,
  title text not null,
  summary text,
  evidence jsonb not null default '{}'::jsonb,
  source_snapshot_id uuid references public.public_snapshots(id) on delete set null,
  source_diff_id uuid references public.public_snapshot_diffs(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'dismissed')),
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_alert_events_status on public.alert_events(status);
create index if not exists idx_alert_events_scope on public.alert_events(scope);
create index if not exists idx_alert_events_created_at on public.alert_events(created_at desc);

-- Indice unico parcial para impedir duplicação: mesma regra e mesmo alvo (bairro/condição) já tem alerta aberto.
create unique index if not exists idx_alert_events_dedupe_open 
on public.alert_events(dedupe_key) 
where status = 'open' and dedupe_key is not null;

alter table public.alert_events enable row level security;
create policy "Qualquer um pode ler eventos abertos"
  on public.alert_events for select
  using (status = 'open' or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));

create policy "Admins e moderators podem gerenciar alert_events"
  on public.alert_events for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));

-- 3) Tabela de execuções de avaliação (alert_runs)
create table if not exists public.alert_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual', 'job', 'cron')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'skipped', 'error')),
  message text,
  alerts_created integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.alert_runs enable row level security;
create policy "Admins e moderators podem ler alert_runs"
  on public.alert_runs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));

-- 4) RPC de avaliação automática de regras
create or replace function public.evaluate_alert_rules(
  in_days integer default 7,
  in_baseline_days integer default 30,
  in_source text default 'manual'
)
returns table (
  ok boolean,
  message text,
  alerts_created integer,
  run_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_alerts_count integer := 0;
  v_rule record;
  v_acc record;
  v_neigh record;
  v_cond record;
  v_dedupe text;
  v_is_authorized boolean := false;
begin
  -- Auth check
  if current_setting('request.jwt.claims', true) is null then
    v_is_authorized := true;
  else
    select exists (
      select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')
    ) into v_is_authorized;
  end if;

  if not v_is_authorized then
    return query select false, 'Não autorizado a avaliar alertas', 0, null::uuid;
    return;
  end if;

  -- Create run
  insert into public.alert_runs (source, status)
  values (in_source, 'running')
  returning id into v_run_id;

  begin
    -- ===========================================
    -- EVALUATE: general_acceleration
    -- ===========================================
    select * into v_rule from public.alert_rules where slug = 'general_acceleration' and is_enabled = true;
    if found then
      for v_acc in (
        select * from public.get_acceleration_alerts(in_days, in_baseline_days, 10)
      ) loop
        -- check thresholds manually or rely on RPC order
        if v_acc.delta_per_day >= coalesce((v_rule.config->>'min_delta_per_day')::numeric, 0)
           and v_acc.severity_rank <= coalesce((v_rule.config->>'min_rank')::integer, 100) then
           
          v_dedupe := 'general_acc:' || v_acc.neighborhood || ':' || v_acc.condition;

          insert into public.alert_events (
            rule_id, scope, neighborhood, condition, severity, title, summary, evidence, dedupe_key
          ) values (
            v_rule.id, v_rule.scope, v_acc.neighborhood, v_acc.condition, v_rule.severity,
            'Aceleração extrema: ' || v_acc.condition || ' em ' || coalesce(v_acc.neighborhood, 'Cidade'),
            'Crescimento diário acelerou em ' || round(v_acc.delta_per_day, 2) || ' relatos/dia.',
            jsonb_build_object('rank', v_acc.severity_rank, 'delta_per_day', v_acc.delta_per_day, 'current_per_day', v_acc.current_per_day),
            v_dedupe
          ) on conflict (dedupe_key) where status = 'open' and dedupe_key is not null do nothing;
          
          if found then v_alerts_count := v_alerts_count + 1; end if;
        end if;
      end loop;
    end if;

    -- ===========================================
    -- EVALUATE: neighborhood_blocked_acceleration
    -- ===========================================
    select * into v_rule from public.alert_rules where slug = 'neighborhood_blocked_acceleration' and is_enabled = true;
    if found then
      -- Here we use neighborhood period deltas and check blocked directly
      for v_neigh in (
        select * from public.get_neighborhood_period_deltas(in_days, in_baseline_days)
      ) loop
        -- Simple heuristic: if current_blocked grew fast
        if v_neigh.current_blocked > v_neigh.baseline_blocked and v_neigh.delta_per_day >= coalesce((v_rule.config->>'min_delta_per_day')::numeric, 0) then
          v_dedupe := 'neigh_blocked:' || coalesce(v_neigh.neighborhood, 'N/A');

          insert into public.alert_events (
            rule_id, scope, neighborhood, severity, title, summary, evidence, dedupe_key
          ) values (
            v_rule.id, v_rule.scope, v_neigh.neighborhood, v_rule.severity,
            'Aumento de bloqueios em ' || coalesce(v_neigh.neighborhood, 'Cidade'),
            'Bairro está reportando bloqueios ou alta densidade diária acima da média histórica.',
            jsonb_build_object('current_blocked', v_neigh.current_blocked, 'baseline_blocked', v_neigh.baseline_blocked, 'delta_per_day', v_neigh.delta_per_day),
            v_dedupe
          ) on conflict (dedupe_key) where status = 'open' and dedupe_key is not null do nothing;

          if found then v_alerts_count := v_alerts_count + 1; end if;
        end if;
      end loop;
    end if;

    -- ===========================================
    -- EVALUATE: condition_bad_spike
    -- ===========================================
    select * into v_rule from public.alert_rules where slug = 'condition_bad_spike' and is_enabled = true;
    if found then
      for v_cond in (
        select * from public.get_condition_period_deltas(in_days, in_baseline_days, null)
      ) loop
        if v_cond.condition in ('holes', 'loose_tiles', 'tree_roots') 
           and v_cond.delta_per_day >= coalesce((v_rule.config->>'min_delta_per_day')::numeric, 0)
           and v_cond.current_per_day >= coalesce((v_rule.config->>'min_current_per_day')::numeric, 0) then
           
           v_dedupe := 'cond_spike:' || v_cond.condition;

           insert into public.alert_events (
            rule_id, scope, condition, severity, title, summary, evidence, dedupe_key
          ) values (
            v_rule.id, v_rule.scope, v_cond.condition, v_rule.severity,
            'Pico sistêmico de problema: ' || v_cond.condition,
            'A taxa diária deste problema crônico subiu de ' || round(v_cond.baseline_per_day, 2) || ' para ' || round(v_cond.current_per_day, 2) || '.',
            jsonb_build_object('delta_per_day', v_cond.delta_per_day, 'current_per_day', v_cond.current_per_day),
            v_dedupe
          ) on conflict (dedupe_key) where status = 'open' and dedupe_key is not null do nothing;

          if found then v_alerts_count := v_alerts_count + 1; end if;
        end if;
      end loop;
    end if;

    -- Update run status
    update public.alert_runs
    set status = 'success',
        finished_at = now(),
        alerts_created = v_alerts_count,
        message = 'Avaliação concluída gerando ' || v_alerts_count || ' alertas novos.'
    where id = v_run_id;

    return query select true, 'Avaliação concluída', v_alerts_count, v_run_id;

  exception when others then
    update public.alert_runs
    set status = 'error',
        finished_at = now(),
        message = substr(sqlerrm, 1, 1000)
    where id = v_run_id;

    return query select false, substr(sqlerrm, 1, 1000), 0, v_run_id;
  end;
end;
$$;

-- 5) RPC Listar Alertas
create or replace function public.list_alert_events(
  in_status text default null,
  in_limit integer default 50
)
returns table (
  id uuid,
  severity text,
  scope text,
  neighborhood text,
  condition text,
  title text,
  summary text,
  status text,
  created_at timestamptz,
  source_snapshot_id uuid,
  source_diff_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_authorized boolean := false;
begin
  -- Se pedir por != 'open', deve ser admin/moderator
  if in_status is null or in_status != 'open' then
    if current_setting('request.jwt.claims', true) is not null then
      select exists (
        select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')
      ) into v_is_authorized;
      
      if not v_is_authorized then
        raise exception 'Apenas admin/moderator pode ler alertas não abertos';
      end if;
    end if;
  end if;

  return query
  select 
    a.id,
    a.severity,
    a.scope,
    a.neighborhood,
    a.condition,
    a.title,
    a.summary,
    a.status,
    a.created_at,
    a.source_snapshot_id,
    a.source_diff_id
  from public.alert_events a
  where (in_status is null or a.status = in_status)
  order by a.created_at desc
  limit in_limit;
end;
$$;

-- 6) RPC Update Status
create or replace function public.update_alert_event_status(
  in_alert_id uuid,
  in_status text
)
returns table (
  ok boolean,
  message text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_authorized boolean := false;
begin
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')
  ) into v_is_authorized;

  if not v_is_authorized then
    return query select false, 'Acesso negado', 'error';
    return;
  end if;

  if in_status not in ('open', 'acknowledged', 'dismissed') then
    return query select false, 'Status inválido', 'error';
    return;
  end if;

  update public.alert_events
  set status = in_status,
      updated_at = now()
  where id = in_alert_id;

  if found then
    return query select true, 'Status atualizado com sucesso', in_status;
  else
    return query select false, 'Alerta não encontrado', 'error';
  end if;
end;
$$;

-- 7) RPC List Runs
create or replace function public.list_alert_runs(
  in_limit integer default 50
)
returns table (
  id uuid,
  source text,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  message text,
  alerts_created integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_authorized boolean := false;
begin
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')
  ) into v_is_authorized;

  if not v_is_authorized then
    raise exception 'Acesso negado. Apenas admin e moderator.';
  end if;

  return query
  select 
    r.id,
    r.source,
    r.started_at,
    r.finished_at,
    r.status,
    r.message,
    r.alerts_created
  from public.alert_runs r
  order by r.started_at desc
  limit in_limit;
end;
$$;
