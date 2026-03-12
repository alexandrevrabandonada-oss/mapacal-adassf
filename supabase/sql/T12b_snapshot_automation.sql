-- T12b_snapshot_automation.sql
-- Automacao operacional de snapshots materializados (manual e agendavel externamente)

create table if not exists public.snapshot_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  frequency text not null,
  days integer not null,
  neighborhood text,
  title_template text,
  is_enabled boolean not null default true,
  last_run_at timestamptz,
  last_snapshot_id uuid references public.public_snapshots(id),
  created_at timestamptz not null default now(),
  constraint snapshot_jobs_kind_check check (kind in ('transparency', 'territory')),
  constraint snapshot_jobs_frequency_check check (frequency in ('daily', 'weekly')),
  constraint snapshot_jobs_days_check check (days in (7, 30, 90, 365))
);

create unique index if not exists uq_snapshot_jobs_identity
  on public.snapshot_jobs (kind, frequency, days, coalesce(neighborhood, ''));

create table if not exists public.snapshot_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.snapshot_jobs(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  message text,
  snapshot_id uuid references public.public_snapshots(id),
  created_at timestamptz not null default now(),
  constraint snapshot_job_runs_status_check check (status in ('running', 'success', 'skipped', 'error'))
);

create index if not exists idx_snapshot_job_runs_job_started
  on public.snapshot_job_runs(job_id, started_at desc);

insert into public.snapshot_jobs (kind, frequency, days, title_template)
select 'transparency', 'daily', 7, 'Auto transparency daily {{date}}'
where not exists (
  select 1 from public.snapshot_jobs
  where kind = 'transparency' and frequency = 'daily' and days = 7 and coalesce(neighborhood, '') = ''
);

insert into public.snapshot_jobs (kind, frequency, days, title_template)
select 'transparency', 'weekly', 30, 'Auto transparency weekly {{date}}'
where not exists (
  select 1 from public.snapshot_jobs
  where kind = 'transparency' and frequency = 'weekly' and days = 30 and coalesce(neighborhood, '') = ''
);

insert into public.snapshot_jobs (kind, frequency, days, title_template)
select 'territory', 'daily', 7, 'Auto territory daily {{date}}'
where not exists (
  select 1 from public.snapshot_jobs
  where kind = 'territory' and frequency = 'daily' and days = 7 and coalesce(neighborhood, '') = ''
);

insert into public.snapshot_jobs (kind, frequency, days, title_template)
select 'territory', 'weekly', 30, 'Auto territory weekly {{date}}'
where not exists (
  select 1 from public.snapshot_jobs
  where kind = 'territory' and frequency = 'weekly' and days = 30 and coalesce(neighborhood, '') = ''
);

create or replace function public.list_snapshot_jobs()
returns table (
  id uuid,
  kind text,
  frequency text,
  days integer,
  neighborhood text,
  is_enabled boolean,
  last_run_at timestamptz,
  last_snapshot_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(current_setting('request.jwt.claim.role', true), '');

  if auth.uid() is null and v_role <> 'service_role' then
    raise exception 'Nao autenticado' using errcode = '42501';
  end if;

  if not public.is_moderator() and v_role <> 'service_role' then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  return query
  select
    j.id,
    j.kind,
    j.frequency,
    j.days,
    j.neighborhood,
    j.is_enabled,
    j.last_run_at,
    j.last_snapshot_id
  from public.snapshot_jobs j
  order by j.kind asc, j.frequency asc, j.days asc, j.created_at asc;
end;
$$;

create or replace function public.list_snapshot_job_runs(
  in_limit integer default 50
)
returns table (
  id uuid,
  job_id uuid,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  message text,
  snapshot_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(current_setting('request.jwt.claim.role', true), '');

  if auth.uid() is null and v_role <> 'service_role' then
    raise exception 'Nao autenticado' using errcode = '42501';
  end if;

  if not public.is_moderator() and v_role <> 'service_role' then
    raise exception 'Sem permissao' using errcode = '42501';
  end if;

  return query
  select
    r.id,
    r.job_id,
    r.started_at,
    r.finished_at,
    r.status,
    r.message,
    r.snapshot_id
  from public.snapshot_job_runs r
  order by r.started_at desc
  limit greatest(coalesce(in_limit, 50), 1);
end;
$$;

create or replace function public.run_snapshot_job(
  in_job_id uuid
)
returns table (
  ok boolean,
  message text,
  status text,
  snapshot_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job record;
  v_run_id uuid;
  v_now timestamptz;
  v_title text;
  v_snapshot_id uuid;
  v_create_result record;
  v_has_success_this_period boolean := false;
  v_role text;
begin
  v_now := now();
  v_role := coalesce(current_setting('request.jwt.claim.role', true), '');

  if auth.uid() is null and v_role <> 'service_role' then
    return query select false, 'Nao autenticado', 'error', null::uuid;
    return;
  end if;

  if not public.is_moderator() and v_role <> 'service_role' then
    return query select false, 'Sem permissao', 'error', null::uuid;
    return;
  end if;

  select *
  into v_job
  from public.snapshot_jobs
  where id = in_job_id;

  if not found then
    return query select false, 'Job nao encontrado', 'error', null::uuid;
    return;
  end if;

  if not v_job.is_enabled then
    return query select false, 'Job desabilitado', 'skipped', null::uuid;
    return;
  end if;

  if v_job.frequency = 'daily' then
    select exists (
      select 1
      from public.snapshot_job_runs r
      where r.job_id = v_job.id
        and r.status = 'success'
        and date_trunc('day', r.started_at) = date_trunc('day', v_now)
    ) into v_has_success_this_period;
  else
    select exists (
      select 1
      from public.snapshot_job_runs r
      where r.job_id = v_job.id
        and r.status = 'success'
        and date_trunc('week', r.started_at) = date_trunc('week', v_now)
    ) into v_has_success_this_period;
  end if;

  if v_has_success_this_period then
    insert into public.snapshot_job_runs (job_id, started_at, finished_at, status, message)
    values (v_job.id, v_now, now(), 'skipped', 'Ja existe execucao success no periodo corrente');

    return query select true, 'Execucao ignorada por anti-duplicacao de periodo', 'skipped', null::uuid;
    return;
  end if;

  insert into public.snapshot_job_runs (job_id, started_at, status, message)
  values (v_job.id, v_now, 'running', 'Execucao iniciada')
  returning id into v_run_id;

  v_title := coalesce(v_job.title_template, 'Auto snapshot {{date}}');
  v_title := replace(v_title, '{{date}}', to_char(v_now, 'YYYY-MM-DD'));

  begin
    select *
    into v_create_result
    from public.create_public_snapshot(
      v_job.kind,
      v_job.days,
      v_job.neighborhood,
      v_title
    );

    if v_create_result.ok is true then
      v_snapshot_id := v_create_result.snapshot_id;

      update public.snapshot_job_runs
      set
        finished_at = now(),
        status = 'success',
        message = coalesce(v_create_result.message, 'Snapshot criado com sucesso'),
        snapshot_id = v_snapshot_id
      where id = v_run_id;

      update public.snapshot_jobs
      set
        last_run_at = now(),
        last_snapshot_id = v_snapshot_id
      where id = v_job.id;

      return query select true, coalesce(v_create_result.message, 'Snapshot criado com sucesso'), 'success', v_snapshot_id;
      return;
    end if;

    update public.snapshot_job_runs
    set
      finished_at = now(),
      status = 'error',
      message = coalesce(v_create_result.message, 'Falha ao criar snapshot')
    where id = v_run_id;

    return query select false, coalesce(v_create_result.message, 'Falha ao criar snapshot'), 'error', null::uuid;
    return;
  exception when others then
    update public.snapshot_job_runs
    set
      finished_at = now(),
      status = 'error',
      message = left(coalesce(SQLERRM, 'Erro interno na execucao do job'), 500)
    where id = v_run_id;

    return query select false, left(coalesce(SQLERRM, 'Erro interno na execucao do job'), 500), 'error', null::uuid;
    return;
  end;
end;
$$;
